import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = (searchParams.get("q") || "").trim()
    const tagsParam = searchParams.get("tags") || ""
    const tags = tagsParam ? tagsParam.split(",").map((t) => t.trim()).filter(Boolean) : []
    const sortBy = (searchParams.get("sortBy") || "popularity").toLowerCase()
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const role = (searchParams.get("role") || "PRO") as "CLIENT" | "PRO" | "ADMIN"

    // Build filters
    const where: any = {
      status: 'ACTIVE',
      role,
    }

    if (query) {
      where.OR = [
        { username: { contains: query, mode: "insensitive" } },
        { businessName: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
      ]
    }

    if (tags.length > 0) {
      // specialties contains any of the provided tags
      where.specialties = { hasSome: tags }
    }

    // Sorting
    let orderBy: any[] = []
    switch (sortBy) {
      case "date":
        orderBy = [{ createdAt: 'desc' }]
        break
      case "name":
        orderBy = [{ username: 'asc' }]
        break
      case "popularity":
      default:
        orderBy = [
          { profileViews: 'desc' },
          { username: 'asc' },
        ]
        break
    }

    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          postsCount: true,
          followersCount: true,
          profileViews: true,
          createdAt: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total,
      },
    })
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}