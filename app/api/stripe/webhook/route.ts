import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;

      case "customer.created":
        await handleCustomerCreated(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  const { customer, amount, currency, metadata } = paymentIntent;

  // Update booking status if it's a booking payment
  if (metadata.bookingId) {
    await prisma.booking.update({
      where: { id: metadata.bookingId },
      data: {
        status: "CONFIRMED",
      },
    });

    // Get booking to find sender and receiver
    const booking = await prisma.booking.findUnique({
      where: { id: metadata.bookingId },
      include: { client: true, pro: true },
    });

    if (booking) {
      // Create payment record
      await prisma.payment.create({
        data: {
          amount: amount / 100, // Convert from cents
          currency,
          status: "COMPLETED",
          stripePaymentIntentId: paymentIntent.id,
          bookingId: metadata.bookingId,
          senderId: booking.clientId,
          receiverId: booking.proId,
        },
      });
    }
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  const { metadata } = paymentIntent;

  if (metadata.bookingId) {
    await prisma.booking.update({
      where: { id: metadata.bookingId },
      data: {
        status: "CANCELLED",
      },
    });

    // Get booking to find sender and receiver
    const booking = await prisma.booking.findUnique({
      where: { id: metadata.bookingId },
      include: { client: true, pro: true },
    });

    if (booking) {
      await prisma.payment.create({
        data: {
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: "FAILED",
          stripePaymentIntentId: paymentIntent.id,
          bookingId: metadata.bookingId,
          senderId: booking.clientId,
          receiverId: booking.proId,
        },
      });
    }
  }
}

async function handleCheckoutCompleted(session: any) {
  const { customer, metadata } = session;

  // Update user with Stripe customer ID if not already set
  if (customer && metadata.userId) {
    await prisma.user.update({
      where: { id: metadata.userId },
      data: { stripeCustomerId: customer },
    });
  }
}

async function handleAccountUpdated(account: any) {
  const { id, charges_enabled, payouts_enabled, metadata } = account;

  if (metadata.userId) {
    await prisma.user.update({
      where: { id: metadata.userId },
      data: {
        stripeAccountId: id,
        verified: charges_enabled && payouts_enabled,
      },
    });
  }
}

async function handleCustomerCreated(customer: any) {
  const { id, email, metadata } = customer;

  if (metadata.userId) {
    await prisma.user.update({
      where: { id: metadata.userId },
      data: { stripeCustomerId: id },
    });
  }
}
