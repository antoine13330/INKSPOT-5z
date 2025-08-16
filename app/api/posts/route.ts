import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"


export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const userId = searchParams.get("userId")
    const skip = (page - 1) * limit

    const whereClause = userId ? { authorId: userId } : {}

    const posts = await prisma.post.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
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
          },
        },
        collaborations: {
          include: {
            pro: {
              select: {
                id: true,
                username: true,
                businessName: true,
                avatar: true,
              },
            },
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
    })

    const formattedPosts = posts.map((post: any) => ({
      id: post.id,
      content: post.content,
      images: post.images,
      hashtags: post.hashtags || [],
      price: post.price,
      isCollaboration: post.isCollaboration,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      viewsCount: post.viewsCount || 0,
      publishedAt: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      author: post.author,
      collaborations: post.collaborations,
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
    console.error("Error fetching posts:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, images, hashtags } = body

    const post = await prisma.post.create({
      data: {
        content,
        images: images || [],
        hashtags: hashtags || [],
        authorId: session.user.id,
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
          },
        },
      },
    })

    return NextResponse.json({
      message: "Post created successfully",
      post: {
        ...post,
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        liked: false,
      },
    })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
