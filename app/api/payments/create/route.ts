import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentIntent, createStripeCustomer } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, amount, currency = "eur" } = await request.json();

    if (!bookingId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        pro: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Ensure user is the client of this booking
    if (booking.clientId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create or get Stripe customer
    let customerId = booking.client.stripeCustomerId;
    if (!customerId) {
      const customer = await createStripeCustomer(
        session.user.id,
        booking.client.email,
        `${booking.client.firstName} ${booking.client.lastName}`.trim()
      );
      customerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(amount, currency, customerId);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount,
        currency: currency.toUpperCase(),
        status: "PENDING",
        stripePaymentIntentId: paymentIntent.id,
        bookingId,
        senderId: session.user.id,
        receiverId: booking.proId,
        description: `Payment for booking: ${booking.title}`,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
} 