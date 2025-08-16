import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

// Type for post with hashtags from Prisma query
interface PostWithHashtags {
  hashtags: string[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!query.trim()) {
      return NextResponse.json({ hashtags: [] })
    }

    // Get all posts and extract hashtags with their frequencies
    const posts: PostWithHashtags[] = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        hashtags: {
          // Use array contains for partial matching
          hasSome: [],
        },
      },
      select: {
        hashtags: true,
      },
    })

    // Count hashtag frequencies and filter by query
    const hashtagCounts: Record<string, number> = {}
    
    posts.forEach((post: PostWithHashtags) => {
      post.hashtags.forEach(hashtag => {
        if (hashtag.toLowerCase().includes(query.toLowerCase())) {
          hashtagCounts[hashtag] = (hashtagCounts[hashtag] || 0) + 1
        }
      })
    })

    // Convert to array and sort by frequency
    const hashtags = Object.entries(hashtagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return NextResponse.json({ hashtags })
  } catch (error) {
    console.error("Error searching hashtags:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}