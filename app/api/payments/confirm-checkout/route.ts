import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const sessionAuth = await getServerSession(authOptions)
    if (!sessionAuth?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 })
    }

    // Retrieve checkout session from Stripe
    if (!stripe) {
      return NextResponse.json({ error: "Payment processing is not available" }, { status: 503 })
    }
    
    const checkout = await stripe.checkout.sessions.retrieve(String(sessionId))
    if (!checkout || checkout.status !== 'complete') {
      return NextResponse.json({ error: "Checkout session not completed" }, { status: 400 })
    }

    const { appointmentId, paymentType, conversationId } = (checkout.metadata || {}) as any
    if (!appointmentId) {
      return NextResponse.json({ error: "Missing appointmentId in metadata" }, { status: 400 })
    }

    // Find or create/update payment record
    const amountPaid = (checkout.amount_total || 0) / 100
    const currency = String(checkout.currency || 'EUR').toUpperCase()

    const existingPayment = await prisma.payment.findFirst({ where: { stripePaymentIntentId: checkout.id } })

    let paymentId: string
    if (existingPayment) {
      const updated = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
          stripePaymentIntentId: (checkout.payment_intent as string) || checkout.id
        }
      })
      paymentId = updated.id
    } else {
      const appt = await prisma.appointment.findUnique({ where: { id: appointmentId }, select: { clientId: true, proId: true, title: true, price: true } })
      if (!appt) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
      }
      
      // Déterminer si c'est un acompte ou un paiement complet
      const existingPayments = await prisma.payment.findMany({
        where: { appointmentId, status: 'COMPLETED' }
      })
      const totalAlreadyPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0)
      const isDeposit = totalAlreadyPaid === 0 && amountPaid < appt.price
      
      let description: string
      if (isDeposit) {
        description = `Acompte pour "${appt.title}"`
      } else if (totalAlreadyPaid > 0) {
        description = `Solde pour "${appt.title}"`
      } else {
        description = `Paiement complet pour "${appt.title}"`
      }
      
      const created = await prisma.payment.create({
        data: {
          appointmentId,
          amount: amountPaid,
          currency,
          status: 'COMPLETED',
          stripePaymentIntentId: (checkout.payment_intent as string) || checkout.id,
          description,
          paidAt: new Date(),
          senderId: appt.clientId,
          receiverId: appt.proId,
        }
      })
      paymentId = created.id
    }

    // Update appointment status
    const apptFull = await prisma.appointment.findUnique({ where: { id: appointmentId }, include: { payments: true, client: true } })
    if (!apptFull) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const totalPaid = apptFull.payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0) + (existingPayment ? 0 : amountPaid)
    const newStatus = totalPaid >= apptFull.price ? 'PAID' : 'CONFIRMED'
    if (newStatus !== apptFull.status) {
      await prisma.appointment.update({ where: { id: appointmentId }, data: { status: newStatus } })
    }

    // Create system message if conversationId is provided
    let messageCreated = null as any
    if (conversationId) {
      messageCreated = await prisma.message.create({
        data: {
          content: newStatus === 'PAID'
            ? `🎉 Paiement confirmé. Le rendez-vous est entièrement payé.`
            : `💳 Acompte payé. Le rendez-vous est maintenant confirmé.`,
          messageType: 'PAYMENT_CONFIRMATION',
          attachments: [],
          conversationId,
          senderId: apptFull.clientId,
        }
      })
      await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } })
    }

    // Best-effort real-time emit (WebSocket disabled for build compatibility)

    return NextResponse.json({
      success: true,
      appointmentId,
      paymentId,
      status: newStatus,
      conversationId: conversationId || null
    })
  } catch (error) {
    console.error('Error confirming checkout session:', error)
    return NextResponse.json({ error: 'Failed to confirm checkout session' }, { status: 500 })
  }
}


