import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

const endpointSecret = process.env.STRIPE_WEBHOOK_APPOINTMENTS_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get("stripe-signature")!

  let event: any

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error(`Webhook signature verification failed:`, err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  const appointmentId = paymentIntent.metadata.appointmentId
  const paymentType = paymentIntent.metadata.paymentType

  if (!appointmentId) {
    console.error('No appointmentId in payment intent metadata')
    return
  }

  // Update payment status in database
  const payment = await prisma.payment.findFirst({
    where: {
      stripePaymentIntentId: paymentIntent.id
    }
  })

  if (!payment) {
    console.error(`Payment not found for payment intent: ${paymentIntent.id}`)
    return
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      paidAt: new Date()
    }
  })

  // Get appointment details
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      payments: true,
      pro: {
        select: {
          id: true,
          username: true,
          businessName: true
        }
      }
    }
  })

  if (!appointment) {
    console.error(`Appointment not found: ${appointmentId}`)
    return
  }

  // Update appointment status based on payment type and current status
  let newStatus = appointment.status
  let messageContent = ""

  if (paymentType === 'deposit' && appointment.status === 'ACCEPTED') {
    // Deposit paid, appointment can now be confirmed by PRO
    newStatus = 'CONFIRMED'
    messageContent = `💳 **Acompte payé !**\n\nL'acompte de ${payment.amount}€ a été payé avec succès. Le rendez-vous "${appointment.title}" est maintenant confirmé.`
  } else if (paymentType === 'full' || (paymentType === 'deposit' && !appointment.depositRequired)) {
    // Full payment completed
    const totalPaid = appointment.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0) + payment.amount

    if (totalPaid >= appointment.price) {
      newStatus = 'CONFIRMED'
      messageContent = `✅ **Paiement complet !**\n\nLe paiement intégral de ${appointment.price}€ a été effectué pour "${appointment.title}". Rendez-vous confirmé !`
    }
  }

  // Update appointment status if changed
  if (newStatus !== appointment.status) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: newStatus }
    })
  }

  // Send message to conversation if we have the conversation ID
  if (appointment.notes && messageContent) {
    const conversationMatch = appointment.notes.match(/Conversation: (\w+)/)
    if (conversationMatch) {
      const conversationId = conversationMatch[1]
      
      await prisma.message.create({
        data: {
          content: messageContent,
          messageType: 'PAYMENT_CONFIRMATION',
          conversationId,
          senderId: appointment.clientId // Payment is from client
        }
      })

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
    }
  }

  // Create notification for the PRO
  if (paymentType === 'deposit') {
    await prisma.notification.create({
      data: {
        title: "Acompte reçu !",
        message: `L'acompte de ${payment.amount}€ a été payé pour "${appointment.title}"`,
        type: "PAYMENT",
        userId: appointment.proId,
        data: {
          appointmentId: appointment.id,
          paymentId: payment.id,
          amount: payment.amount,
          type: "deposit_received"
        }
      }
    })
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  const appointmentId = paymentIntent.metadata.appointmentId

  if (!appointmentId) {
    console.error('No appointmentId in payment intent metadata')
    return
  }

  // Update payment status
  const payment = await prisma.payment.findFirst({
    where: {
      stripePaymentIntentId: paymentIntent.id
    }
  })

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED'
      }
    })
  }

  // Optionally send notification about failed payment
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId }
  })

  if (appointment) {
    await prisma.notification.create({
      data: {
        title: "Échec du paiement",
        message: `Le paiement pour "${appointment.title}" a échoué. Veuillez réessayer.`,
        type: "PAYMENT",
        userId: appointment.clientId,
        data: {
          appointmentId: appointment.id,
          type: "payment_failed"
        }
      }
    })
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  const appointmentId = session.metadata.appointmentId
  const paymentType = session.metadata.paymentType
  const conversationId = session.metadata.conversationId

  if (!appointmentId) {
    console.error('No appointmentId in checkout session metadata')
    return
  }

  // Update payment status in database
  const payment = await prisma.payment.findFirst({
    where: {
      stripePaymentIntentId: session.id
    }
  })

  if (!payment) {
    console.error(`Payment not found for checkout session: ${session.id}`)
    return
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
      paidAt: new Date(),
      stripePaymentIntentId: session.payment_intent || session.id
    }
  })

  // Get appointment details
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      payments: true,
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
      }
    }
  })

  if (!appointment) {
    console.error(`Appointment not found: ${appointmentId}`)
    return
  }

  // Update appointment status based on payment type
  let newStatus = appointment.status
  let messageContent = ""
  
  // Calculate total paid including this payment
  const totalPaid = appointment.payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0) + payment.amount

  if (paymentType === 'deposit') {
    // Deposit paid, appointment can now be confirmed by PRO
    if (totalPaid >= appointment.price) {
      // Full payment through deposit (rare case)
      newStatus = 'PAID'
      messageContent = `🎉 **Paiement complet via acompte !**\n\nLe paiement intégral de ${appointment.price}€ a été effectué pour "${appointment.title}". Rendez-vous entièrement payé !`
    } else {
      newStatus = 'CONFIRMED'
      messageContent = `💳 **Acompte payé !**\n\nL'acompte de ${payment.amount}€ a été payé avec succès pour "${appointment.title}". Le rendez-vous est maintenant confirmé. Montant restant : ${appointment.price - totalPaid}€`
    }
  } else {
    // Full payment or remaining balance
    if (totalPaid >= appointment.price) {
      newStatus = 'PAID'
      messageContent = `🎉 **Paiement complet !**\n\nLe paiement intégral de ${appointment.price}€ a été effectué pour "${appointment.title}". Rendez-vous entièrement payé et confirmé !`
    } else {
      newStatus = 'CONFIRMED'
      messageContent = `💳 **Paiement partiel reçu**\n\nPaiement de ${payment.amount}€ reçu pour "${appointment.title}". Montant restant : ${appointment.price - totalPaid}€`
    }
  }

  // Update appointment status if changed
  if (newStatus !== appointment.status) {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: newStatus }
    })
  }

  // Send message to conversation
  if (conversationId && messageContent) {
    await prisma.message.create({
      data: {
        content: messageContent,
        messageType: 'PAYMENT_CONFIRMATION',
        conversationId,
        senderId: appointment.clientId // Payment is from client
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })
    // Emit realtime update to the conversation room
    try {
      const { getSocketIOServer } = require('@/lib/websocket')
      const io = getSocketIOServer()
      if (io) {
        io.to(`conversation:${conversationId}`).emit('conversation-message', {
          type: 'NEW_MESSAGE',
          message: {
            id: `sys_${Date.now()}`,
            content: messageContent,
            messageType: 'payment',
            attachments: [],
            conversationId,
            senderId: appointment.clientId,
            createdAt: new Date().toISOString(),
          },
          conversationId,
          timestamp: new Date().toISOString()
        })
      }
    } catch (e) {
      console.warn('WebSocket emission skipped (server not ready):', e)
    }
  }

  // Create notifications
  if (paymentType === 'deposit') {
    await prisma.notification.create({
      data: {
        title: "Acompte reçu !",
        message: `L'acompte de ${payment.amount}€ a été payé par ${appointment.client.firstName || appointment.client.username} pour "${appointment.title}"`,
        type: "PAYMENT",
        userId: appointment.proId,
        data: {
          appointmentId: appointment.id,
          paymentId: payment.id,
          amount: payment.amount,
          type: "deposit_received"
        }
      }
    })
  } else {
    await prisma.notification.create({
      data: {
        title: "Paiement reçu !",
        message: `Paiement de ${payment.amount}€ reçu pour "${appointment.title}"`,
        type: "PAYMENT",
        userId: appointment.proId,
        data: {
          appointmentId: appointment.id,
          paymentId: payment.id,
          amount: payment.amount,
          type: "payment_received"
        }
      }
    })
  }
}
