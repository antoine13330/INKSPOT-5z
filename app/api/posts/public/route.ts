import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch public posts without authentication
    const posts = await prisma.post.findMany({
      where: {
        published: true,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            businessName: true,
            avatar: true,
            verified: true,
            role: true,
          },
        },
        hashtags: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    })

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      images: post.images || [],
      hashtags: post.hashtags.map((tag) => tag.name),
      price: post.price,
      isCollaboration: post.isCollaboration,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      viewsCount: post._count.views,
      publishedAt: post.createdAt.toISOString(),
      author: post.author,
      liked: false, // Not authenticated, so can't know if liked
    }))

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page: 1,
        limit: 20,
        hasMore: posts.length === 20,
      },
    })
  } catch (error) {
    console.error("Error fetching public posts:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
