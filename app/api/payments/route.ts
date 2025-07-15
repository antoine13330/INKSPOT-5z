import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, recipientId } = await request.json()

    // Mock payment processing
    const payment = {
      id: `payment_${Date.now()}`,
      amount,
      currency: currency || "USD",
      status: "completed",
      recipientId,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      payment,
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "Payment failed" }, { status: 500 })
  }
}
