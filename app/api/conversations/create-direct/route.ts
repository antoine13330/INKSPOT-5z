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

    // Ne pas créer de message automatique. La conversation reste vide
    // Optionnellement, on pourrait envoyer une notification silencieuse ici si désiré

    return NextResponse.json({
      message: "Conversation created successfully",
      conversation: {
        id: conversationId,
        title: subject || "Nouvelle conversation",
      },
    })

  } catch (error) {
    console.error("Error creating direct conversation:", error)
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    )
  }
}
