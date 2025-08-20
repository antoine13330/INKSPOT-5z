import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, message, postId, attachments } = body as {
      conversationId?: string
      message?: string
      postId?: string
      attachments?: string[]
    }

    // Validate required fields
    if (!conversationId || (!message && (!attachments || attachments.length === 0))) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur est membre de la conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        members: true,
        messages: true
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      )
    }

    // Vérifier si c'est le premier message
    const isFirstMessage = conversation.messages.length === 0

    // Créer le message
    const newMessage = await prisma.message.create({
      data: {
        content: message || "",
        messageType: attachments && attachments.length > 0 ? "image" : "text",
        attachments: attachments || [],
        conversationId: conversationId,
        senderId: session.user.id,
      },
    })

    // Si c'est le premier message, activer la conversation
    if (isFirstMessage) {
      console.log("🚀 Premier message envoyé - Activation de la conversation:", conversationId)
      
      // Trouver l'autre participant
      const otherParticipant = conversation.members.find(
        member => member.userId !== session.user.id
      )

      if (otherParticipant) {
        // Créer une notification pour l'autre participant
        await prisma.notification.create({
          data: {
            type: "MESSAGE",
            title: "Nouvelle conversation",
            message: "Quelqu'un souhaite discuter avec vous",
            userId: otherParticipant.userId,
            data: {
              conversationId: conversationId,
              postId: postId,
            },
          },
        })

        console.log("📢 Notification envoyée à:", otherParticipant.userId)
      }
    }

    // Si c'est le premier message, basculer le statut de la conversation en ACTIVE
    if (isFirstMessage) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "ACTIVE", updatedAt: new Date() }
      })
    }

    return NextResponse.json({
      success: true,
      messageId: newMessage.id,
      isFirstMessage: isFirstMessage,
      conversationActivated: isFirstMessage
    })

  } catch (error) {
    console.error("Error activating conversation:", error)
    return NextResponse.json(
      { error: "Failed to activate conversation" },
      { status: 500 }
    )
  }
}
