import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentIntent, createStripeCustomer, createCheckoutSession } from "@/lib/stripe";
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId, bookingId, amount, currency = "eur", type = "FULL_PAYMENT" } = await request.json();

    if ((!appointmentId && !bookingId) || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get appointment or booking details
    let appointment = null;
    let booking = null;
    let clientId = session.user.id;
    let proId = "";
    let title = "";
    let description = "";

    if (appointmentId) {
      appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          pro: true,
          payments: true,
        },
      });

      if (!appointment) {
        return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
      }

      // Ensure user is the client of this appointment
      if (appointment.clientId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      clientId = appointment.clientId;
      proId = appointment.proId;
      title = appointment.title;
      
      // Déterminer la description selon le type de paiement
      switch (type) {
        case 'DEPOSIT':
          description = `Caution pour "${title}"`;
          break;
        case 'REMAINING_BALANCE':
          description = `Solde restant pour "${title}"`;
          break;
        case 'FULL_PAYMENT':
          description = `Paiement complet pour "${title}"`;
          break;
        default:
          description = `Paiement pour "${title}"`;
      }
    } else if (bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          client: true,
          pro: true,
          payments: true,
        },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      // Ensure user is the client of this booking
      if (booking.clientId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      clientId = booking.clientId;
      proId = booking.proId;
      title = booking.title;
      description = `Paiement pour "${title}"`;
    }

    // Create or get Stripe customer
    const client = appointment?.client || booking?.client;
    let customerId = client.stripeCustomerId;
    if (!customerId) {
      const customer = await createStripeCustomer(
        clientId,
        client.email,
        `${client.firstName} ${client.lastName}`.trim()
      );
      customerId = customer.id;

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: clientId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      appointmentId: appointmentId || "",
      clientId: clientId,
      proId: proId,
      description: description,
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: amount / 100, // Convertir de centimes en euros pour la base de données
        currency: currency.toUpperCase(),
        status: "PENDING",
        type: type,
        stripePaymentIntentId: paymentIntent.paymentIntentId,
        description: description,
        senderId: clientId,
        receiverId: proId,
        appointmentId: appointmentId,
        bookingId: bookingId,
      },
    });

    // Créer un lien de paiement Stripe Checkout
    const checkoutUrl = await createCheckoutSession({
      paymentIntentId: paymentIntent.paymentIntentId,
      amount: amount,
      currency: currency,
      description: description,
      successUrl: `${process.env.NEXTAUTH_URL}/conversations/${appointmentId || bookingId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/conversations/${appointmentId || bookingId}?payment=cancel`,
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      clientSecret: paymentIntent.clientSecret,
      checkoutUrl: checkoutUrl,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}