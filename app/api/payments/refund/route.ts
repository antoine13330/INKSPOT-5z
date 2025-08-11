import { type NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
export const dynamic = "force-dynamic"
import { authOptions } from "@/lib/auth"
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"
import { refundPayment } from "@/lib/stripe"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { paymentId, amount, reason } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ message: "Payment ID is required" }, { status: 400 })
    }

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            client: true,
            pro: true,
          },
        },
        sender: true,
        receiver: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 })
    }

    // Check if user has permission to refund
    const isAuthorized = 
      payment.senderId === session.user.id || // Payment sender
      payment.receiverId === session.user.id || // Payment receiver
      session.user.role === "ADMIN" // Admin

    if (!isAuthorized) {
      return NextResponse.json({ message: "Not authorized to refund this payment" }, { status: 403 })
    }

    // Check if payment can be refunded
    if (payment.status !== "COMPLETED") {
      return NextResponse.json({ message: "Only completed payments can be refunded" }, { status: 400 })
    }

    // Validate refund amount
    const refundAmount = amount || payment.amount
    if (refundAmount > payment.amount) {
      return NextResponse.json({ message: "Refund amount cannot exceed payment amount" }, { status: 400 })
    }

    if (!payment.stripePaymentIntentId) {
      return NextResponse.json({ message: "Payment intent ID not found" }, { status: 400 })
    }

    // Process refund with Stripe
    const stripeRefund = await refundPayment(
      payment.stripePaymentIntentId,
      refundAmount
    )

    // Create refund record in database
    const refundRecord = await prisma.payment.create({
      data: {
        amount: -refundAmount, // Negative amount for refund
        currency: payment.currency,
        status: "COMPLETED",
        description: reason || `Refund for payment ${payment.id}`,
        senderId: payment.receiverId, // Reverse the flow
        receiverId: payment.senderId,
        bookingId: payment.bookingId,
      },
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        amount: -refundAmount,
        currency: payment.currency,
        type: "REFUND",
        status: "completed",
        description: `Refund: ${reason || 'Payment refund'}`,
        userId: payment.senderId, // The original sender receives the refund
        paymentId: refundRecord.id,
      },
    })

    // Update booking status if this was a booking payment
    if (payment.booking) {
      // If full deposit refund, cancel the booking
      if (refundAmount === payment.booking.depositAmount && payment.amount === payment.booking.depositAmount) {
        await prisma.booking.update({
          where: { id: payment.booking.id },
          data: { 
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        })

        // Create notifications
        await Promise.all([
          prisma.notification.create({
            data: {
              title: "Booking Cancelled",
              message: `Your booking "${payment.booking.title}" has been cancelled and refunded`,
              type: "BOOKING",
              userId: payment.booking.clientId,
              data: {
                bookingId: payment.booking.id,
                refundAmount,
                type: "booking_cancelled_refund",
              },
            },
          }),
          prisma.notification.create({
            data: {
              title: "Booking Cancelled",
              message: `Booking "${payment.booking.title}" was cancelled - deposit refunded to client`,
              type: "BOOKING",
              userId: payment.booking.proId,
              data: {
                bookingId: payment.booking.id,
                refundAmount,
                type: "booking_cancelled_refund",
              },
            },
          }),
        ])
      }
    } else {
      // For direct payments, create notifications
      await Promise.all([
        prisma.notification.create({
          data: {
            title: "Refund Processed",
            message: `Refund of €${refundAmount} has been processed`,
            type: "PAYMENT",
            userId: payment.senderId,
            data: {
              paymentId: refundRecord.id,
              refundAmount,
              type: "refund_received",
            },
          },
        }),
        prisma.notification.create({
          data: {
            title: "Refund Issued",
            message: `You issued a refund of €${refundAmount}`,
            type: "PAYMENT",
            userId: payment.receiverId,
            data: {
              paymentId: refundRecord.id,
              refundAmount,
              type: "refund_issued",
            },
          },
        }),
      ])
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refundRecord.id,
        amount: refundAmount,
        stripeRefundId: stripeRefund.id,
        status: "completed",
      },
    })
  } catch (error) {
    console.error("Error processing refund:", error)
    return NextResponse.json(
      { message: "Failed to process refund", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}