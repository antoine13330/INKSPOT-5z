import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { postId } = params

    // Vérifier que le post existe
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      )
    }

    // Vérifier si le post est déjà en favori
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId,
        },
      },
    })

    if (existingFavorite) {
      // Retirer des favoris
      await prisma.favorite.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: postId,
          },
        },
      })

      return NextResponse.json({ 
        message: "Post removed from favorites",
        favorited: false 
      })
    } else {
      // Ajouter aux favoris
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          postId: postId,
        },
      })

      return NextResponse.json({ 
        message: "Post added to favorites",
        favorited: true 
      })
    }
  } catch (error) {
    console.error("Error toggling favorite:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
