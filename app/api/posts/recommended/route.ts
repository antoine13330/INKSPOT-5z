import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRecommendedPosts } from "@/lib/recommendations"
import { getAIRecommendedPosts } from "@/lib/recommendations-ai"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const useAI = searchParams.get("useAI") !== "false" // Default to AI recommendations
    const diversify = searchParams.get("diversify") !== "false"
    const boostTrending = searchParams.get("boostTrending") !== "false"

    let posts: any[]

    if (useAI) {
      // Use AI-powered recommendations
      posts = await getAIRecommendedPosts(session.user.id, {
        limit,
        diversify,
        boostTrending,
      })
    } else {
      // Use legacy recommendation system
      posts = await getRecommendedPosts(session.user.id, limit)
    }

    // Apply pagination for AI recommendations
    if (useAI && page > 1) {
      const startIndex = (page - 1) * limit
      posts = posts.slice(startIndex, startIndex + limit)
    }

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      images: post.images,
      hashtags: post.hashtags,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      viewsCount: post.viewsCount,
      createdAt: typeof post.createdAt === 'string' ? post.createdAt : post.createdAt.toISOString(),
      author: post.author,
      liked: post.liked,
    }))

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
      meta: {
        algorithm: useAI ? 'AI-powered' : 'legacy',
        diversified: diversify,
        trendingBoosted: boostTrending,
      },
    })
  } catch (error) {
    console.error("Error fetching recommended posts:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
