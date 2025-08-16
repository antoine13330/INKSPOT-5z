import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: conversationId } = await params
    const body = await request.json()
    const { content, type = "text" } = body

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      )
    }

    // Verify user is member of conversation
    const membership = await prisma.conversationMember.findFirst({
      where: {
        conversationId,
        userId: session.user.id,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied to this conversation" },
        { status: 403 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        messageType: type,
        conversationId,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    })

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // Transform message to match expected format
    const transformedMessage = {
      id: message.id,
      content: message.content,
      type: message.messageType,
      isFromUser: message.senderId === session.user.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      readBy: [],
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: transformedMessage,
      messageId: message.id
    })

  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
