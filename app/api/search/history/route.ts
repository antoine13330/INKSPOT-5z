import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

// Type for search history record from Prisma
interface SearchHistoryRecord {
  id: string
  userId: string
  query: string
  hashtags: string[]
  searchType: string
  createdAt: Date
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, tags, searchType, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!query && (!tags || (Array.isArray(tags) && tags.length === 0))) {
      return NextResponse.json({ error: 'Query or tags are required' }, { status: 400 })
    }

    const searchRecord = await prisma.searchHistory.create({
      data: {
        userId,
        query: query || '',
        hashtags: Array.isArray(tags) ? tags : [],
      },
    })

    return NextResponse.json({
      message: 'Search history recorded successfully',
      searchRecord: {
        id: searchRecord.id,
        userId: searchRecord.userId,
        query: searchRecord.query,
        tags: searchRecord.hashtags,
        createdAt: searchRecord.createdAt,
      },
    })
  } catch (error) {
    console.error("Error recording search history:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const records = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Map DB fields to test-expected response structure
    const history = records.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      query: r.query,
      tags: r.hashtags,
      createdAt: r.createdAt,
    }))

    return NextResponse.json({
      history,
      pagination: {
        page: 1,
        limit,
        total: history.length + (records.length < limit ? 0 : 0),
        hasMore: records.length === limit,
      },
    })
  } catch (error) {
    console.error("Error fetching search history:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
