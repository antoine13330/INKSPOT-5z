import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get("stripe-signature")!

    let event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ message: "Invalid signature" }, { status: 400 })
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object)
        break

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object)
        break

      case "transfer.created":
        await handleTransferCreated(event.data.object)
        break

      case "payout.paid":
        await handlePayoutPaid(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ message: "Webhook error" }, { status: 500 })
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    // Update payment status
    const payment = await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
      data: {
        status: "COMPLETED",
      },
      include: {
        booking: {
          include: {
            client: true,
            pro: true,
          },
        },
      },
    })

    if (payment.booking) {
      // If this is a deposit payment, confirm the booking
      if (payment.amount === payment.booking.depositAmount) {
        await prisma.booking.update({
          where: { id: payment.booking.id },
          data: { status: "CONFIRMED" },
        })

        // Create notifications
        await Promise.all([
          prisma.notification.create({
            data: {
              title: "Booking Confirmed",
              message: `Your booking "${payment.booking.title}" has been confirmed`,
              type: "BOOKING",
              userId: payment.booking.clientId,
              data: {
                bookingId: payment.booking.id,
                type: "booking_confirmed",
              },
            },
          }),
          prisma.notification.create({
            data: {
              title: "Deposit Received",
              message: `Deposit received for "${payment.booking.title}"`,
              type: "PAYMENT",
              userId: payment.booking.proId,
              data: {
                bookingId: payment.booking.id,
                paymentId: payment.id,
                type: "deposit_received",
              },
            },
          }),
        ])
      }

      // Create transaction record
      await prisma.transaction.create({
        data: {
          amount: payment.amount,
          currency: payment.currency,
          type: payment.amount === payment.booking.depositAmount ? "DEPOSIT" : "BOOKING_PAYMENT",
          status: "completed",
          description: payment.description || `Payment for ${payment.booking.title}`,
          userId: payment.receiverId,
          paymentId: payment.id,
        },
      })
    }
  } catch (error) {
    console.error("Error handling payment succeeded:", error)
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
      data: {
        status: "FAILED",
      },
    })
  } catch (error) {
    console.error("Error handling payment failed:", error)
  }
}

async function handleTransferCreated(transfer: any) {
  try {
    // Record the transfer
    await prisma.transaction.create({
      data: {
        amount: transfer.amount / 100, // Convert from cents
        currency: transfer.currency.toUpperCase(),
        type: "PAYOUT",
        status: "completed",
        stripeTransferId: transfer.id,
        description: transfer.description || "Payout to professional",
        userId: transfer.destination, // This should be mapped to user ID
      },
    })
  } catch (error) {
    console.error("Error handling transfer created:", error)
  }
}

async function handlePayoutPaid(payout: any) {
  try {
    // Update transaction status if needed
    await prisma.transaction.updateMany({
      where: {
        stripeTransferId: payout.id,
      },
      data: {
        status: "completed",
      },
    })
  } catch (error) {
    console.error("Error handling payout paid:", error)
  }
}
