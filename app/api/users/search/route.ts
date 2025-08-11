import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const userType = searchParams.get("userType") as 'CLIENT' | 'PRO' | 'ADMIN' | null

    const session = await getServerSession(authOptions)

    if (!query.trim()) {
      return NextResponse.json({ users: [] })
    }

    const whereConditions: unknown = {
      status: 'ACTIVE',
      OR: [
        {
          username: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          firstName: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          businessName: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    }

    if (userType) {
      whereConditions.role = userType
    }

    const users = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        verified: true,
        businessName: true,
        location: true,
        specialties: true,
        hourlyRate: true,
      },
      orderBy: [
        { verified: 'desc' },
        { profileViews: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}