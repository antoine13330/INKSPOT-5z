import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { recordUserInteraction } from "@/lib/recommendations"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId, interactionType, weight = 1 } = body

    if (!targetUserId || !interactionType) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    await recordUserInteraction(session.user.id, targetUserId, interactionType, weight)

    return NextResponse.json({ message: "Interaction recorded successfully" })
  } catch (error) {
    console.error("Error recording interaction:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
