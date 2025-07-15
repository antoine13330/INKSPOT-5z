import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const session = await getServerSession(authOptions)

    if (!query.trim()) {
      return NextResponse.json({ posts: [] })
    }

    // Extract hashtags from query
    const hashtagRegex = /#[\w]+/g
    const hashtags = query.match(hashtagRegex) || []
    const textQuery = query.replace(hashtagRegex, "").trim()

    // Build search conditions
    const searchConditions: any[] = []

    // Search by hashtags
    if (hashtags.length > 0) {
      searchConditions.push({
        hashtags: {
          hasSome: hashtags,
        },
      })
    }

    // Search by content
    if (textQuery) {
      searchConditions.push({
        content: {
          contains: textQuery,
          mode: "insensitive",
        },
      })
    }

    // Search by author username
    if (textQuery) {
      searchConditions.push({
        author: {
          username: {
            contains: textQuery,
            mode: "insensitive",
          },
        },
      })
    }

    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        OR: searchConditions.length > 0 ? searchConditions : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
            verified: true,
            businessName: true,
            specialties: true,
            hourlyRate: true,
            profileTheme: true,
          },
        },
        likes: session?.user?.id
          ? {
              where: {
                userId: session.user.id,
              },
            }
          : false,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          likesCount: "desc",
        },
      ],
      skip,
      take: limit,
    })

    // Update view counts
    if (posts.length > 0) {
      await prisma.post.updateMany({
        where: {
          id: {
            in: posts.map((p) => p.id),
          },
        },
        data: {
          viewsCount: {
            increment: 1,
          },
        },
      })
    }

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      images: post.images,
      hashtags: post.hashtags,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      viewsCount: post.viewsCount + 1, // Include the increment
      createdAt: post.createdAt.toISOString(),
      author: post.author,
      liked: session?.user?.id ? post.likes.length > 0 : false,
    }))

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    })
  } catch (error) {
    console.error("Error searching posts:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
