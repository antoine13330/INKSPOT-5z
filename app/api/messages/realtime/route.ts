import { type NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

// Get messages for a conversation with real-time support
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 })
    }

    // Verify user is member of conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: session.user.id,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get messages with pagination
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
            description: true,
          },
        },
        booking: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: offset,
      take: limit,
    })

    // Get total count for pagination
    const totalMessages = await prisma.message.count({
      where: { conversationId },
    })

    // Mark messages as read for current user
    await prisma.conversationMember.updateMany({
      where: {
        conversationId,
        userId: session.user.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    })

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Send a message (this will be handled by WebSocket, but kept for fallback)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, conversationId, messageType = "text", attachments = [] } = body

    if (!content || !conversationId) {
      return NextResponse.json({ error: "Content and conversation ID required" }, { status: 400 })
    }

    // Verify user is member of conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: session.user.id,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        messageType,
        attachments,
        conversationId,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ 
      success: true, 
      message: {
        id: message.id,
        content: message.content,
        messageType: message.messageType,
        attachments: message.attachments,
        conversationId: message.conversationId,
        senderId: message.senderId,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
      }
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Search messages in conversation
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { conversationId, query, messageType } = body

    if (!conversationId || !query) {
      return NextResponse.json({ error: "Conversation ID and search query required" }, { status: 400 })
    }

    // Verify user is member of conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: session.user.id,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Build search conditions
    const searchConditions: unknown = {
      conversationId,
      content: {
        contains: query,
        mode: 'insensitive',
      },
    }

    if (messageType) {
      searchConditions.messageType = messageType
    }

    // Search messages
    const messages = await prisma.message.findMany({
      where: searchConditions,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit search results
    })

    return NextResponse.json({
      success: true,
      messages: messages.map(message => ({
        id: message.id,
        content: message.content,
        messageType: message.messageType,
        attachments: message.attachments,
        conversationId: message.conversationId,
        senderId: message.senderId,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
      })),
      query,
    })
  } catch (error) {
    console.error("Error searching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}