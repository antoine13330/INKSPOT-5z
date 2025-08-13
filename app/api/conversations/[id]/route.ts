import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

// Get conversation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: conversationId } = await params

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

    // Get conversation details with members
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            messageType: true,
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Format response
    const formattedConversation = {
      id: conversation.id,
      title: conversation.title,
      isGroup: conversation.isGroup,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
      members: conversation.members.map((member) => ({
        id: member.user.id,
        username: member.user.username,
        name: member.user.name,
        avatar: member.user.avatar,
        isOnline: member.user.isOnline,
        lastSeen: member.user.lastSeen?.toISOString(),
        joinedAt: member.joinedAt.toISOString(),
        lastReadAt: member.lastReadAt?.toISOString(),
      })),
      lastMessage: conversation.messages[0] ? {
        id: conversation.messages[0].id,
        content: conversation.messages[0].content,
        messageType: conversation.messages[0].messageType,
        createdAt: conversation.messages[0].createdAt.toISOString(),
      } : null,
    }

    return NextResponse.json(formattedConversation)
  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update conversation settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: conversationId } = await params
    const body = await request.json()
    const { title } = body

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

    // Update conversation
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        title: title?.trim() || undefined,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      conversation: {
        id: updatedConversation.id,
        title: updatedConversation.title,
        updatedAt: updatedConversation.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error updating conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete conversation (leave conversation)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = params.id

    // Remove user from conversation
    await prisma.conversationMember.deleteMany({
      where: {
        conversationId,
        userId: session.user.id,
      },
    })

    // Check if conversation has any remaining members
    const remainingMembers = await prisma.conversationMember.count({
      where: { conversationId },
    })

    // If no members left, delete the conversation
    if (remainingMembers === 0) {
      await prisma.conversation.delete({
        where: { id: conversationId },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error leaving conversation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}