import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 API: Fetching conversation...')
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('❌ API: Unauthorized - no session')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: conversationId } = await params
    console.log('🔍 API: Looking for conversation:', conversationId)

    // Get conversation with members and messages
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
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true,
                businessName: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
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
        }
      }
    })

    if (!conversation) {
      console.log('❌ API: Conversation not found or access denied')
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      )
    }

    console.log('✅ API: Conversation found, transforming data...')

    // Transform conversation to match expected format
    const otherMembers = conversation.members
      .filter(member => member.userId !== session.user.id)
      .map(member => ({
        id: member.id,
        conversationId: conversation.id,
        userId: member.user.id,
        joinedAt: member.joinedAt.toISOString(),
        lastReadAt: member.lastReadAt?.toISOString(),
        user: {
          id: member.user.id,
          username: member.user.username,
          firstName: member.user.firstName,
          lastName: member.user.lastName,
          avatar: member.user.avatar,
          role: member.user.role,
          businessName: member.user.businessName
        }
      }))

    const transformedConversation = {
      id: conversation.id,
      title: conversation.title,
      members: otherMembers, // Changed from participants to members
      messages: conversation.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        type: msg.messageType,
        isFromUser: msg.senderId === session.user.id,
        conversationId: conversation.id,
        senderId: msg.senderId,
        readBy: [], // TODO: Implement read status
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString()
      })),

      isActive: conversation.status === 'ACTIVE' || conversation.messages.length > 0,
      type: conversation.isGroup ? 'GROUP' : 'DIRECT',
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      data: transformedConversation
    })

  } catch (error) {
    console.error("Error fetching conversation:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    )
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { params } = await context
    const { id: conversationId } = await params

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