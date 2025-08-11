import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT - Modifier un commentaire
export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { postId, commentId } = params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json(
        { message: "Comment content is required" },
        { status: 400 }
      )
    }

    // Vérifier que le commentaire existe et appartient à l'utilisateur
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    })

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      )
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json(
        { message: "You can only edit your own comments" },
        { status: 403 }
      )
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            verified: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error("Error updating comment:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un commentaire
export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { postId, commentId } = params

    // Vérifier que le commentaire existe
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { include: { author: true } } },
    })

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      )
    }

    // L'utilisateur peut supprimer ses propres commentaires
    // OU l'artiste qui a créé le post peut supprimer n'importe quel commentaire
    if (
      comment.authorId !== session.user.id &&
      comment.post.author.id !== session.user.id
    ) {
      return NextResponse.json(
        { message: "You can only delete your own comments or comments on your posts" },
        { status: 403 }
      )
    }

    // Supprimer le commentaire et toutes ses réponses
    await prisma.comment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Error deleting comment:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
