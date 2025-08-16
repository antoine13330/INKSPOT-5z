import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

// Type for post with hashtags and engagement from Prisma query
interface PostWithEngagement {
  hashtags: string[]
  likesCount: number
  commentsCount: number
  viewsCount: number
}

// Type for search history record from Prisma
interface SearchHistoryRecord {
  query: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    // Get trending hashtags from recent posts
    const recentPosts: PostWithEngagement[] = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        hashtags: true,
        likesCount: true,
        commentsCount: true,
        viewsCount: true,
      },
    })

    // Count hashtag frequencies with engagement weight
    const hashtagStats: Record<string, { count: number; engagement: number }> = {}
    
    recentPosts.forEach((post: PostWithEngagement) => {
      const engagement = post.likesCount + post.commentsCount + (post.viewsCount / 10)
      post.hashtags.forEach(hashtag => {
        if (!hashtagStats[hashtag]) {
          hashtagStats[hashtag] = { count: 0, engagement: 0 }
        }
        hashtagStats[hashtag].count += 1
        hashtagStats[hashtag].engagement += engagement
      })
    })

    // Sort hashtags by trending score (combination of frequency and engagement)
    const trendingHashtags = Object.entries(hashtagStats)
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        engagement: stats.engagement,
        trendingScore: stats.count * Math.log(stats.engagement + 1), // Logarithmic scaling for engagement
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)

    // Get trending search queries from recent search history
    const recentSearches: SearchHistoryRecord[] = await prisma.searchHistory.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        query: true,
      },
    })

    // Count query frequencies
    const queryCounts: Record<string, number> = {}
    recentSearches.forEach((search: SearchHistoryRecord) => {
      const normalizedQuery = search.query.toLowerCase().trim()
      if (normalizedQuery.length > 2) {
        queryCounts[normalizedQuery] = (queryCounts[normalizedQuery] || 0) + 1
      }
    })

    const trendingQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return NextResponse.json({
      hashtags: trendingHashtags,
      queries: trendingQueries,
      trending: [...trendingHashtags, ...trendingQueries], // Combined for backward compatibility
    })
  } catch (error) {
    console.error("Error fetching trending content:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}