import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's conversations (only ACTIVE ones with messages)
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        },
        // Ne montrer que les conversations avec au moins un message
        messages: {
          some: {}
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
            createdAt: 'desc'
          },
          take: 1,
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
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform conversations to match the expected format
    const transformedConversations = conversations.map((conversation: any) => {
      // Get other participants (excluding current user)
      const otherParticipants = conversation.members
        .filter((member: any) => member.userId !== session.user.id)
        .map((member: any) => ({
          id: member.user.id,
          name: member.user.businessName || `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || member.user.username,
          username: member.user.username,
          avatar: member.user.avatar,
          role: member.user.role
        }));

      // Get last message
      const lastMessage = conversation.messages[0] ? {
        id: conversation.messages[0].id,
        content: conversation.messages[0].content,
        type: conversation.messages[0].messageType,
        isFromUser: conversation.messages[0].senderId === session.user.id,
        conversationId: conversation.id,
        senderId: conversation.messages[0].senderId,
        readBy: [], // TODO: Implement read status
        createdAt: conversation.messages[0].createdAt.toISOString(),
        updatedAt: conversation.messages[0].updatedAt.toISOString()
      } : undefined;

      // Calculate unread count (TODO: Implement proper unread tracking)
      const unreadCount = 0;

      return {
        id: conversation.id,
        participants: otherParticipants,
        lastMessage,
        unreadCount,
        isActive: true,
        type: conversation.isGroup ? 'GROUP' : 'DIRECT',
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      conversations: transformedConversations
    });

  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
