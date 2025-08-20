import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPayout, createTransfer } from "@/lib/stripe"
export const dynamic = "force-dynamic"


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { proId, amount, type = "manual" } = await request.json()

    // Check if user is admin or the PRO themselves
    const isAdmin = session.user.role === "ADMIN"
    const isPro = session.user.id === proId

    if (!isAdmin && !isPro) {
      return NextResponse.json({ message: "Not authorized to request payout" }, { status: 403 })
    }

    // Find the PRO user
    const pro = await prisma.user.findFirst({
      where: {
        id: proId,
        role: "PRO",
      },
    })

    if (!pro) {
      return NextResponse.json({ message: "Professional not found" }, { status: 404 })
    }

    if (!pro.stripeAccountId) {
      return NextResponse.json({ message: "Stripe account not set up for this professional" }, { status: 400 })
    }

    // Calculate available balance for payout
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: proId,
        type: {
          in: ["BOOKING_PAYMENT", "DEPOSIT"],
        },
        status: "completed",
      },
    })

    const payouts = await prisma.transaction.findMany({
      where: {
        userId: proId,
        type: "PAYOUT",
        status: "completed",
      },
    })

    const totalEarnings = transactions.reduce((sum: number, t: any) => sum + t.amount, 0)
    const totalPayouts = payouts.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)
    const availableBalance = totalEarnings - totalPayouts

    // Validate payout amount
    const payoutAmount = amount || availableBalance
    if (payoutAmount > availableBalance) {
      return NextResponse.json({ 
        message: "Payout amount exceeds available balance",
        availableBalance,
        requestedAmount: payoutAmount,
      }, { status: 400 })
    }

    if (payoutAmount <= 0) {
      return NextResponse.json({ message: "No funds available for payout" }, { status: 400 })
    }

    // Minimum payout amount (e.g., €10)
    if (payoutAmount < 10) {
      return NextResponse.json({ message: "Minimum payout amount is €10" }, { status: 400 })
    }

    // Create payout with Stripe
    const stripePayout = await createPayout(payoutAmount, pro.stripeAccountId)

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        amount: -payoutAmount, // Negative for payout
        currency: "EUR",
        type: "PAYOUT",
        status: "pending",
        stripeTransferId: stripePayout.id,
        description: `Payout to ${pro.firstName && pro.lastName ? `${pro.firstName} ${pro.lastName}` : pro.email}`,
        userId: proId,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        title: "Payout Initiated",
        message: `Payout of €${payoutAmount} has been initiated and will arrive in 1-2 business days`,
        type: "PAYMENT",
        userId: proId,
        data: {
          transactionId: transaction.id,
          amount: payoutAmount,
          type: "payout_initiated",
          estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      payout: {
        id: transaction.id,
        amount: payoutAmount,
        stripePayoutId: stripePayout.id,
        status: "pending",
        estimatedArrival: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 jours par défaut
      },
    })
  } catch (error) {
    console.error("Error processing payout:", error)
    return NextResponse.json(
      { message: "Failed to process payout", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// GET endpoint to check available balance and payout history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const proId = url.searchParams.get("proId") || session.user.id

    // Check if user can access this data
    const isAdmin = session.user.role === "ADMIN"
    const isPro = session.user.id === proId

    if (!isAdmin && !isPro) {
      return NextResponse.json({ message: "Not authorized to view this data" }, { status: 403 })
    }

    // Get all transactions for the PRO
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: proId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        payment: {
          include: {
            booking: true,
          },
        },
      },
    })

    // Calculate balance
    const earnings = transactions
      .filter((t: any) => ["BOOKING_PAYMENT", "DEPOSIT"].includes(t.type) && t.status === "completed")
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    // Calculer les gains par type
    const depositEarnings = transactions
      .filter((t: any) => t.type === "DEPOSIT" && t.status === "completed")
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    const fullPaymentEarnings = transactions
      .filter((t: any) => t.type === "BOOKING_PAYMENT" && t.status === "completed")
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    // Calculer les gains du mois en cours
    const currentMonth = new Date()
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const monthlyEarnings = transactions
      .filter((t: any) => 
        ["BOOKING_PAYMENT", "DEPOSIT"].includes(t.type) && 
        t.status === "completed" &&
        new Date(t.createdAt) >= startOfMonth
      )
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    const payouts = transactions
      .filter((t: any) => t.type === "PAYOUT" && t.status === "completed")
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)

    const pendingPayouts = transactions
      .filter((t: any) => t.type === "PAYOUT" && t.status === "pending")
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)

    const availableBalance = earnings - payouts - pendingPayouts

    // Get recent payouts
    const recentPayouts = transactions
      .filter((t: any) => t.type === "PAYOUT")
      .slice(0, 10)

    return NextResponse.json({
      balance: {
        available: availableBalance,
        totalEarnings: earnings,
        totalPayouts: payouts,
        pendingPayouts,
        // Ajouter les détails sur les types de gains
        depositEarnings,
        fullPaymentEarnings,
        monthlyEarnings,
        totalTransactions: transactions.length
      },
      recentPayouts,
      canRequestPayout: availableBalance >= 10, // Minimum payout amount
    })
  } catch (error) {
    console.error("Error fetching payout data:", error)
    return NextResponse.json(
      { message: "Failed to fetch payout data" },
      { status: 500 }
    )
  }
}