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
    const { appointmentId } = session.metadata

    if (appointmentId) {
      // Get appointment data to get client and pro IDs
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { clientId: true, proId: true }
      })

      if (appointment) {
        // Créer un paiement pour cette session
        await prisma.payment.create({
          data: {
            appointmentId,
            amount: session.amount_total / 100,
            currency: session.currency.toUpperCase(),
            status: 'COMPLETED',
            stripePaymentIntentId: session.payment_intent,
            description: `Paiement via checkout Stripe`,
            paidAt: new Date(),
            senderId: appointment.clientId,
            receiverId: appointment.proId,
          }
        })

        // Mettre à jour le statut du rendez-vous
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: 'PAID' }
        })
      }
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
