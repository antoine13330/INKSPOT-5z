import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRecommendedPosts } from "@/lib/recommendations"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const posts = await getRecommendedPosts(session.user.id, limit)

    return NextResponse.json({
      posts: posts.map((post) => ({
        id: post.id,
        content: post.content,
        images: post.images,
        hashtags: post.hashtags,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        viewsCount: post.viewsCount,
        createdAt: post.createdAt.toISOString(),
        author: post.author,
        liked: post.liked,
      })),
    })
  } catch (error) {
    console.error("Error fetching recommended posts:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
