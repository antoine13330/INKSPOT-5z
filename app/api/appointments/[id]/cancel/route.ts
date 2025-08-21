import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { PrismaClient, Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: appointmentId } = await params
    const { reason = "Annulation demandée" } = await request.json()

    // Find the appointment with payments
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        pro: {
          select: {
            id: true,
            username: true,
            businessName: true
          }
        },
        client: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        payments: {
          where: {
            status: 'COMPLETED'
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Verify user can cancel (either client or pro)
    if (appointment.clientId !== session.user.id && appointment.proId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to cancel this appointment" }, { status: 403 })
    }

    // Check if appointment can be cancelled
    if (['CANCELLED', 'COMPLETED'].includes(appointment.status)) {
      return NextResponse.json({ error: "Cannot cancel appointment in current status" }, { status: 400 })
    }

    // Calculate refund amount
    const totalPaid = appointment.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
    let refundAmount = 0
    
    // Determine refund policy based on who cancels and when
    const now = new Date()
    const appointmentDate = new Date(appointment.startDate)
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (session.user.id === appointment.clientId) {
      // Client cancellation
      if (hoursUntilAppointment > 48) {
        refundAmount = totalPaid // Full refund if >48h
      } else if (hoursUntilAppointment > 24) {
        refundAmount = totalPaid * 0.5 // 50% refund if >24h
      } else {
        refundAmount = 0 // No refund if <24h
      }
    } else {
      // Pro cancellation - full refund
      refundAmount = totalPaid
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update appointment status
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { 
          status: 'CANCELLED'
        }
      })

      // Create refunds if there's any amount to refund
      const refunds = []
      if (refundAmount > 0 && appointment.payments.length > 0) {
        // Check if Stripe is configured
        if (!stripe) {
          throw new Error('Stripe is not configured')
        }
        
        // Process refunds through Stripe
        for (const payment of appointment.payments) {
          const refundAmountForPayment = Math.min(payment.amount, refundAmount)
          if (refundAmountForPayment > 0) {
            try {
              const stripeRefund = await stripe.refunds.create({
                payment_intent: payment.stripePaymentIntentId || '',
                amount: Math.round(refundAmountForPayment * 100), // Convert to cents
                reason: 'requested_by_customer',
                metadata: {
                  appointmentId: appointment.id,
                  userId: session.user.id,
                  originalPaymentId: payment.id
                }
              })

              // Record refund in database
              const refund = await tx.payment.create({
                data: {
                  appointmentId: appointment.id,
                  amount: -refundAmountForPayment, // Negative amount for refund
                  currency: appointment.currency,
                  status: 'COMPLETED',
                  description: `Remboursement pour "${appointment.title}" - ${reason}`,
                  senderId: appointment.proId, // Refund comes from pro
                  receiverId: appointment.clientId, // Goes to client
                  stripePaymentIntentId: stripeRefund.id
                }
              })

              refunds.push(refund)
              refundAmount -= refundAmountForPayment
            } catch (stripeError) {
              console.error('Stripe refund error:', stripeError)
              // Continue with other refunds if one fails
            }
          }
        }
      }

      return { updatedAppointment, refunds, totalRefunded: refunds.reduce((sum: number, r: any) => sum + Math.abs(r.amount), 0) }
    })

    // Send notifications
    const isClientCancelling = session.user.id === appointment.clientId
    const cancellerName = isClientCancelling 
      ? (appointment.client.firstName || appointment.client.username)
      : (appointment.pro.businessName || appointment.pro.username)

    // Notify the other party
    const notificationRecipient = isClientCancelling ? appointment.proId : appointment.clientId
    
    await prisma.notification.create({
      data: {
        title: "Rendez-vous annulé",
        message: `Le rendez-vous "${appointment.title}" a été annulé par ${cancellerName}. ${result.totalRefunded > 0 ? `Remboursement de ${result.totalRefunded}€ en cours.` : ''}`,
        type: "APPOINTMENT",
        userId: notificationRecipient,
        data: {
          appointmentId: appointment.id,
          type: "appointment_cancelled",
          refundAmount: result.totalRefunded
        }
      }
    })

    // Create status history entry
    await prisma.appointmentStatusHistory.create({
      data: {
        appointmentId: appointment.id,
        oldStatus: appointment.status,
        newStatus: 'CANCELLED',
        changedBy: session.user.id,
        reason: reason,
        metadata: {
          refundAmount: result.totalRefunded,
          hoursBeforeAppointment: Math.round(hoursUntilAppointment)
        }
      }
    })

    return NextResponse.json({
      success: true,
      appointment: result.updatedAppointment,
      refundAmount: result.totalRefunded,
      refunds: result.refunds.map(r => ({
        id: r.id,
        amount: Math.abs(r.amount),
        status: r.status
      }))
    })

  } catch (error) {
    console.error("Error cancelling appointment:", error)
    return NextResponse.json({ 
      error: "Failed to cancel appointment" 
    }, { status: 500 })
  }
}
