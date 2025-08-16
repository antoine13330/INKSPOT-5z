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
    const { participantId, postId, subject } = body

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
        messages: true, // Inclure les messages pour vérifier s'il y en a
      },
    })

    let conversationId: string
    let isNewConversation = false
    let conversationStatus = "EXISTING"

    if (existingConversation) {
      // Use existing conversation
      conversationId = existingConversation.id
      
      // Vérifier si la conversation a des messages
      if (existingConversation.messages.length === 0) {
        conversationStatus = "DRAFT"
        console.log("✅ Conversation existante sans messages (DRAFT):", conversationId)
      } else {
        conversationStatus = "ACTIVE"
        console.log("✅ Conversation active existante trouvée:", conversationId)
      }
    } else {
      // Create new conversation (sera en DRAFT car pas de messages)
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
      isNewConversation = true
      conversationStatus = "DRAFT"
      console.log("✅ Nouvelle conversation DRAFT créée:", conversationId)

      // PAS de message initial - la conversation reste en DRAFT
      // PAS de notification - l'autre personne ne voit pas encore la conversation
    }

    return NextResponse.json({
      success: true,
      conversationId: conversationId,
      isNewConversation: isNewConversation,
      status: conversationStatus,
      redirectUrl: `/conversations/${conversationId}`
    })

  } catch (error) {
    console.error("Error checking/creating conversation:", error)
    return NextResponse.json(
      { error: "Failed to check/create conversation" },
      { status: 500 }
    )
  }
}
