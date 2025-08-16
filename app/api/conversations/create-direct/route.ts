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
    const { participantId, postId, subject, type } = body

    // Validate required fields
    if (!participantId || !postId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        members: {
          every: {
            userId: {
              in: [session.user.id, participantId],
            },
          },
        },
        isGroup: false,
      },
      include: {
        members: true,
      },
    })

    let conversationId: string

    if (existingConversation) {
      // Use existing conversation
      conversationId = existingConversation.id
    } else {
      // Create new conversation
      const conversation = await prisma.conversation.create({
        data: {
          title: subject || "Nouvelle conversation",
          isGroup: false,
          members: {
            create: [
              { userId: session.user.id },
              { userId: participantId },
            ],
          },
        },
      })
      conversationId = conversation.id
    }

    // Create initial message
    const initialMessage = await prisma.message.create({
      data: {
        content: `Bonjour ! Je suis intéressé(e) par votre post. Pouvez-vous me donner plus de détails ?`,
        messageType: "text",
        conversationId: conversationId,
        senderId: session.user.id,
      },
    })

    // Create notification for the participant
    await prisma.notification.create({
      data: {
        type: "MESSAGE",
        title: "Nouvelle conversation",
        message: "Quelqu'un souhaite discuter avec vous",
        userId: participantId,
        data: {
          conversationId: conversationId,
          postId: postId,
        },
      },
    })

    return NextResponse.json({
      message: "Conversation created successfully",
      conversation: {
        id: conversationId,
        title: subject || "Nouvelle conversation",
      },
      messageId: initialMessage.id,
    })

  } catch (error) {
    console.error("Error creating direct conversation:", error)
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    )
  }
}
