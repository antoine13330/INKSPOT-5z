import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createPaymentIntent } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, amount, currency = "EUR" } = body

    if (!appointmentId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Vérifier que l'utilisateur est le client du rendez-vous
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { pro: true, client: true }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    if (appointment.clientId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (appointment.status !== 'CONFIRMED') {
      return NextResponse.json({ error: "Appointment must be confirmed before payment" }, { status: 400 })
    }

    // Créer l'intention de paiement Stripe
    const paymentIntent = await createPaymentIntent({
      amount,
      currency,
      appointmentId,
      clientId: session.user.id,
      proId: appointment.proId,
      description: `Paiement pour ${appointment.title}`,
      metadata: {
        appointmentType: appointment.type,
        appointmentDate: appointment.startDate.toISOString(),
      }
    })

    // Créer l'enregistrement de paiement en base
    const payment = await prisma.payment.create({
      data: {
        appointmentId,
        amount,
        currency,
        status: 'PENDING',
        stripePaymentIntentId: paymentIntent.paymentIntentId,
        description: `Paiement pour ${appointment.title}`,
        senderId: appointment.clientId,
        receiverId: appointment.proId,
      }
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.paymentIntentId,
    })

  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 })
  }
}
