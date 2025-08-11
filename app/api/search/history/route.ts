import { type NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
export const dynamic = "force-dynamic"
import { authOptions } from "@/lib/auth"
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { query, hashtags } = body

    await prisma.searchHistory.create({
      data: {
        query,
        hashtags: hashtags || [],
        userId: session.user.id,
      },
    })

    return NextResponse.json({ message: "Search history recorded" })
  } catch (error) {
    console.error("Error recording search history:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const searchHistory = await prisma.searchHistory.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })

    return NextResponse.json({ searchHistory })
  } catch (error) {
    console.error("Error fetching search history:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
