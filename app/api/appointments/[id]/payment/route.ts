import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('Payment API called with Stripe key:', process.env.STRIPE_SECRET_KEY ? 'Present' : 'Missing')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: appointmentId } = await params
    const { paymentType = 'deposit' } = await request.json()

    // Find the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        pro: {
          select: {
            id: true,
            username: true,
            businessName: true,
            stripeAccountId: true
          }
        },
        client: {
          select: {
            id: true,
            username: true,
            email: true,
            stripeCustomerId: true
          }
        },
        payments: true
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Verify user is the client for this appointment
    if (appointment.clientId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Check appointment status: allow paying deposit when status is PROPOSED and deposit is required
    if (!['PROPOSED', 'ACCEPTED', 'CONFIRMED'].includes(appointment.status)) {
      return NextResponse.json({ error: "Invalid appointment status for payment" }, { status: 400 })
    }

    // Calculate payment amount
    let amount: number
    let description: string

    if (paymentType === 'deposit') {
      if (!appointment.depositRequired) {
        return NextResponse.json({ error: "No deposit required for this appointment" }, { status: 400 })
      }
      
      // Check if deposit already paid
      const depositPaid = appointment.payments.some(p => 
        p.status === 'COMPLETED' && (p.description || '').toLowerCase().includes('acompte')
      )
      
      if (depositPaid) {
        return NextResponse.json({ error: "Deposit already paid" }, { status: 400 })
      }
      
      amount = Math.round((appointment.depositAmount || 0) * 100) // Convert to cents
      description = `Acompte pour "${appointment.title}"`
    } else {
      // Full payment or remaining balance
      const paidAmount = appointment.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0)
      
      const remainingAmount = appointment.price - paidAmount
      
      if (remainingAmount <= 0) {
        return NextResponse.json({ error: "Payment already completed" }, { status: 400 })
      }
      
      amount = Math.round(remainingAmount * 100) // Convert to cents
      description = `Solde restant pour "${appointment.title}"`
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 })
    }

    // Create or get Stripe customer
    let customerId = appointment.client.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: appointment.client.email!,
        name: appointment.client.username,
        metadata: {
          userId: appointment.clientId
        }
      })
      
      customerId = customer.id
      
      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: appointment.clientId },
        data: { stripeCustomerId: customerId }
      })
    }

    // Determine conversationId from appointment notes if available
    let conversationIdFromNotes: string | undefined
    if (appointment.notes) {
      const match = appointment.notes.match(/Conversation:\s*([\w-]+)/)
      if (match) {
        conversationIdFromNotes = match[1]
      }
    }

    // Build URLs
    const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
    const successUrl = conversationIdFromNotes
      ? `${baseAppUrl}/conversations/${conversationIdFromNotes}?payment=success&session_id={CHECKOUT_SESSION_ID}`
      : `${baseAppUrl}/conversations?to=${appointment.proId}&payment=success&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = conversationIdFromNotes
      ? `${baseAppUrl}/conversations/${conversationIdFromNotes}?payment=cancelled`
      : `${baseAppUrl}/conversations?to=${appointment.proId}&payment=cancelled`

    // Create Stripe Checkout session
    console.log('Creating Stripe Checkout session for appointment:', appointmentId)
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: appointment.currency.toLowerCase(),
            product_data: {
              name: description,
              description: `Rendez-vous: ${appointment.title}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        appointmentId: appointment.id,
        paymentType,
        userId: session.user.id,
        proId: appointment.proId,
        ...(conversationIdFromNotes ? { conversationId: conversationIdFromNotes } : {})
      }
    })

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        amount: amount / 100, // Convert back to euros
        currency: appointment.currency,
        status: 'PENDING',
        stripePaymentIntentId: checkoutSession.id, // Use session ID
        description,
        senderId: appointment.clientId,
        receiverId: appointment.proId
      }
    })

    console.log('Checkout session created:', {
      id: checkoutSession.id,
      url: checkoutSession.url,
      mode: checkoutSession.mode
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
      amount: amount / 100,
      currency: appointment.currency,
      description,
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status
      }
    })

  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json({ 
      error: "Failed to create payment intent" 
    }, { status: 500 })
  }
}
