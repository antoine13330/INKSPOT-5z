import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log("Webhook event received:", event.type)

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object)
        break
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object)
        break
      case "checkout.session.completed":
        await handleCheckoutSuccess(event.data.object)
        break
      case "charge.refunded":
        await handleRefund(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    const { appointmentId } = paymentIntent.metadata

    // Mettre à jour le statut du paiement
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
      }
    })

    // Mettre à jour le statut du rendez-vous
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'PAID' }
      })

      // Créer une notification
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true, pro: true }
      })

      if (appointment) {
        await prisma.notification.create({
          data: {
            type: 'PAYMENT',
            title: 'Paiement confirmé',
            message: `Le paiement pour "${appointment.title}" a été confirmé.`,
            userId: appointment.proId,
            data: { appointmentId, paymentIntentId: paymentIntent.id }
          }
        })

        await prisma.notification.create({
          data: {
            type: 'PAYMENT',
            title: 'Paiement reçu',
            message: `Votre paiement pour "${appointment.title}" a été confirmé.`,
            userId: appointment.clientId,
            data: { appointmentId, paymentIntentId: paymentIntent.id }
          }
        })

        // Émettre un événement WebSocket pour la mise à jour en temps réel
        try {
          // WebSocket functionality disabled for build compatibility
          // const { getSocketIOServer } = require('@/lib/websocket')
          const io = null // getSocketIOServer()
          
          if (io) {
            // Notifier le client
            io.to(`user:${appointment.clientId}`).emit('payment-confirmed', {
              type: 'PAYMENT_CONFIRMED',
              appointmentId,
              status: 'PAID',
              timestamp: new Date().toISOString()
            })

            // Notifier le pro
            io.to(`user:${appointment.proId}`).emit('payment-confirmed', {
              type: 'PAYMENT_CONFIRMED',
              appointmentId,
              status: 'PAID',
              timestamp: new Date().toISOString()
            })

            console.log(`WebSocket payment confirmation sent for appointment ${appointmentId}`)
          }
        } catch (e) {
          console.warn('WebSocket emission failed for payment confirmation:', e)
        }
      }
    }
  } catch (error) {
    console.error("Error handling payment success:", error)
  }
}

async function handlePaymentFailure(paymentIntent: any) {
  try {
    const { appointmentId } = paymentIntent.metadata

    // Mettre à jour le statut du paiement
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: 'FAILED' }
    })

    // Créer une notification d'échec
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { client: true }
      })

      if (appointment) {
        await prisma.notification.create({
          data: {
            type: 'PAYMENT',
            title: 'Échec du paiement',
            message: `Le paiement pour "${appointment.title}" a échoué. Veuillez réessayer.`,
            userId: appointment.clientId,
            data: { appointmentId, paymentIntentId: paymentIntent.id }
          }
        })
      }
    }
  } catch (error) {
    console.error("Error handling payment failure:", error)
  }
}

async function handleCheckoutSuccess(session: any) {
  try {
    const { appointmentId, paymentType, conversationId } = session.metadata || {}

    if (!appointmentId) return

    // Find existing payment created at checkout creation time by session.id
    const existingPayment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: session.id }
    })

    const amountPaid = (session.amount_total || 0) / 100
    const currency = String(session.currency || 'EUR').toUpperCase()

    let paymentRecordId: string | null = null
    if (existingPayment) {
      const updated = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
          stripePaymentIntentId: (session.payment_intent as string) || session.id
        }
      })
      paymentRecordId = updated.id
    } else {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { clientId: true, proId: true }
      })
      if (!appointment) return
      const created = await prisma.payment.create({
        data: {
          appointmentId,
          amount: amountPaid,
          currency,
          status: 'COMPLETED',
          stripePaymentIntentId: (session.payment_intent as string) || session.id,
          description: `Paiement via Stripe Checkout`,
          paidAt: new Date(),
          senderId: appointment.clientId,
          receiverId: appointment.proId,
        }
      })
      paymentRecordId = created.id
    }

    // Compute new appointment status
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { payments: true, client: true, pro: true }
    })
    if (!appointment) return

    const totalPaid = appointment.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0) + (existingPayment ? 0 : amountPaid)

    let newStatus = appointment.status
    if (paymentType === 'deposit') {
      newStatus = totalPaid >= appointment.price ? 'PAID' : 'CONFIRMED'
    } else {
      newStatus = totalPaid >= appointment.price ? 'PAID' : 'CONFIRMED'
    }

    if (newStatus !== appointment.status) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: newStatus }
      })

      // Émettre un événement WebSocket pour la mise à jour en temps réel
      try {
        // WebSocket functionality disabled for build compatibility
        // const { getSocketIOServer } = require('@/lib/websocket')
        const io = null // getSocketIOServer()
        
        if (io) {
          // Notifier le client
          io.to(`user:${appointment.clientId}`).emit('appointment-status-updated', {
            type: 'APPOINTMENT_STATUS_UPDATED',
            appointmentId,
            status: newStatus,
            timestamp: new Date().toISOString()
          })

          // Notifier le pro
          io.to(`user:${appointment.proId}`).emit('appointment-status-updated', {
            type: 'APPOINTMENT_STATUS_UPDATED',
            appointmentId,
            status: newStatus,
            timestamp: new Date().toISOString()
          })

          console.log(`WebSocket appointment status update sent: ${appointmentId} -> ${newStatus}`)
        }
      } catch (e) {
        console.warn('WebSocket emission failed for appointment status update:', e)
      }
    }

    // Persist a system message and emit real-time event to conversation room if available
    try {
      // WebSocket functionality disabled for build compatibility
      // const { getSocketIOServer } = require('@/lib/websocket')
      const io = null // getSocketIOServer()
      if (conversationId) {
        // Create a system message in the conversation
        const sysMessage = await prisma.message.create({
          data: {
            content: newStatus === 'PAID'
              ? `🎉 Paiement confirmé. Le rendez-vous est entièrement payé.`
              : `💳 Acompte payé. Le rendez-vous est maintenant confirmé.`,
            messageType: 'PAYMENT_CONFIRMATION',
            attachments: [],
            conversationId,
            senderId: appointment.clientId,
          }
        })

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        })

        if (io) {
        io.to(`conversation:${conversationId}`).emit('conversation-message', {
          type: 'NEW_MESSAGE',
          message: {
            id: sysMessage.id,
            content: sysMessage.content,
            messageType: 'payment',
            attachments: sysMessage.attachments,
            conversationId: sysMessage.conversationId,
            senderId: sysMessage.senderId,
            createdAt: sysMessage.createdAt.toISOString(),
          },
          conversationId,
          timestamp: new Date().toISOString()
        })
        }
      }
    } catch (e) {
      console.warn('WebSocket emission skipped (server not ready):', e)
    }
  } catch (error) {
    console.error("Error handling checkout success:", error)
  }
}

async function handleRefund(charge: any) {
  try {
    const paymentIntentId = charge.payment_intent

    // Mettre à jour le statut du paiement
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: charge.amount_refunded / 100,
      }
    })
  } catch (error) {
    console.error("Error handling refund:", error)
  }
}
