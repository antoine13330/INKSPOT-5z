import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params
    const session = await getServerSession(authOptions)

    // Récupérer le post avec toutes ses relations
    const post = await prisma.post.findUnique({
      where: { id: postId },
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
      },
    })

    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur connecté a liké ce post
    let liked = false
    let favorited = false

    if (session?.user?.id) {
      // Vérifier le like
      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId,
          },
        },
      })
      liked = !!like

      // Vérifier le favori (si vous avez une table favorites)
      // const favorite = await prisma.favorite.findUnique({
      //   where: {
      //     userId_postId: {
      //       userId: session.user.id,
      //       postId: postId,
      //     },
      //   },
      // })
      // favorited = !!favorite
    }

    // Incrémenter le compteur de vues
    await prisma.post.update({
      where: { id: postId },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
    })

    const formattedPost = {
      id: post.id,
      content: post.content,
      images: post.images || [],
      hashtags: post.hashtags.map((tag) => tag.name),
      price: post.price,
      isCollaboration: post.isCollaboration,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      viewsCount: post._count.views + 1, // +1 pour la vue actuelle
      publishedAt: post.createdAt.toISOString(),
      author: post.author,
      collaborations: post.collaborations,
      liked,
      favorited,
    }

    return NextResponse.json({ post: formattedPost })
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
