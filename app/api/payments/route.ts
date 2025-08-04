import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPaymentIntent } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { amount, currency = "EUR", recipientId, description, bookingId } = await request.json()

    if (!amount || !recipientId) {
      return NextResponse.json({ message: "Amount and recipient are required" }, { status: 400 })
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    })

    if (!recipient) {
      return NextResponse.json({ message: "Recipient not found" }, { status: 404 })
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
      currency.toLowerCase(),
      sender.stripeCustomerId || undefined
    )

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        amount,
        currency: currency.toUpperCase(),
        status: "PENDING",
        stripePaymentIntentId: paymentIntent.id,
        description: description || `Payment to ${recipient.username || recipient.email}`,
        senderId: session.user.id,
        receiverId: recipientId,
        bookingId,
      },
      include: {
        sender: true,
        receiver: true,
        booking: true,
      },
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        clientSecret: paymentIntent.client_secret,
        stripePaymentIntentId: paymentIntent.id,
      },
    })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json(
      { success: false, message: "Payment failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get("userId") || session.user.id
    const type = url.searchParams.get("type") || "all" // "sent", "received", "all"

    // Check if user can access this data
    const isAdmin = session.user.role === "ADMIN"
    const isOwner = session.user.id === userId

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Not authorized to view this data" }, { status: 403 })
    }

    let whereClause = {}
    
    switch (type) {
      case "sent":
        whereClause = { senderId: userId }
        break
      case "received":
        whereClause = { receiverId: userId }
        break
      default:
        whereClause = {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        }
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar: true,
          },
        },
        booking: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to last 50 payments
    })

    return NextResponse.json({
      success: true,
      payments,
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch payments" },
      { status: 500 }
    )
  }
}
