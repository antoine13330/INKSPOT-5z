import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const tags = searchParams.get("tags")?.split(",") || []
    const role = searchParams.get("role") || "PRO"
    const sortBy = searchParams.get("sortBy") || "popularity"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const session = await getServerSession(authOptions)

    // Build where conditions
    const whereConditions: any = {
      status: 'ACTIVE',
      role: role,
    }

    // Add query search conditions
    if (query.trim()) {
      whereConditions.OR = [
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
        {
          bio: {
            contains: query,
            mode: "insensitive",
          },
        },
      ]
    }

    // Add tags/specialties filtering
    if (tags.length > 0) {
      whereConditions.specialties = {
        hasSome: tags
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build orderBy conditions
    let orderBy: any[] = []
    switch (sortBy) {
      case "popularity":
        orderBy = [
          { verified: 'desc' },
          { profileViews: 'desc' },
          { username: 'asc' }
        ]
        break
      case "date":
        orderBy = [
          { createdAt: 'desc' },
          { username: 'asc' }
        ]
        break
      case "name":
        orderBy = [
          { username: 'asc' }
        ]
        break
      default:
        orderBy = [
          { verified: 'desc' },
          { profileViews: 'desc' },
          { username: 'asc' }
        ]
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
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
          bio: true,
          profileViews: true,
          createdAt: true,
        },
        orderBy: orderBy,
        skip: skip,
        take: limit,
      }),
      prisma.user.count({ where: whereConditions })
    ])

    const hasMore = skip + limit < totalCount

    return NextResponse.json({ 
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore
      }
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error("Error searching users:", error)
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}