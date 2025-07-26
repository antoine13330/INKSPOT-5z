import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe, createPaymentIntent } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { amount, currency = "eur", receiverId, description, bookingId } = await request.json()

    if (!amount || !receiverId) {
      return NextResponse.json({ message: "Amount and receiverId are required" }, { status: 400 })
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    })

    if (!receiver) {
      return NextResponse.json({ message: "Receiver not found" }, { status: 404 })
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!sender) {
      return NextResponse.json({ message: "Sender not found" }, { status: 404 })
    }

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(
      amount,
      currency,
      sender.stripeCustomerId || undefined,
      amount * 0.1, // 10% platform fee
      receiver.stripeAccountId ? { destination: receiver.stripeAccountId } : undefined
    )

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        amount,
        currency: currency.toUpperCase(),
        status: "PENDING",
        stripePaymentIntentId: paymentIntent.id,
        description: description || `Payment to ${receiver.username}`,
        senderId: session.user.id,
        receiverId,
        bookingId: bookingId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        title: "Payment Received",
        message: `You received a payment of €${amount} from ${sender.username}`,
        type: "PAYMENT",
        userId: receiverId,
        data: {
          paymentId: payment.id,
          amount,
          currency,
          senderId: session.user.id,
        },
      },
    })

    return NextResponse.json({
      success: true,
      payment,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount,
      },
    })
  } catch (error) {
    console.error("Payment creation error:", error)
    return NextResponse.json({ success: false, message: "Payment failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Get user's payments (sent and received)
    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        booking: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    })

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        hasMore: payments.length === limit,
      },
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
