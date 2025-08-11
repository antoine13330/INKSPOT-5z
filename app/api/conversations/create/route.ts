import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth";
export const dynamic = "force-dynamic"
import { authOptions } from "@/lib/auth";
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { artistId, postId, price, message } = body;

    // Validate required fields
    if (!artistId || !postId || !price || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if the artist exists and is a PRO user
    const artist = await prisma.user.findUnique({
      where: { id: artistId },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    if (artist.role !== "PRO") {
      return NextResponse.json(
        { error: "Specified user is not an artist" },
        { status: 400 }
      );
    }

    // Check if conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        members: {
          every: {
            userId: {
              in: [session.user.id, artistId],
            },
          },
        },
        isGroup: false,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                businessName: true,
              },
            },
          },
        },
      },
    });

    let conversationId: string;

    if (existingConversation) {
      // Use existing conversation
      conversationId = existingConversation.id;
    } else {
      // Create new conversation
      const conversation = await prisma.conversation.create({
        data: {
          title: `Discussion about post`,
          isGroup: false,
          members: {
            create: [
              { userId: session.user.id },
              { userId: artistId },
            ],
          },
        },
      });
      conversationId = conversation.id;
    }

    // Create initial message
    const initialMessage = await prisma.message.create({
      data: {
        content: message,
        messageType: "text",
        conversationId: conversationId,
        senderId: session.user.id,
      },
    });

    // Create notification for the artist
    await prisma.notification.create({
      data: {
        type: "MESSAGE",
        title: "New collaboration request",
        message: `Someone wants to collaborate with you on a post and discuss pricing.`,
        userId: artistId,
        data: {
          conversationId: conversationId,
          postId: postId,
          price: price,
        },
      },
    });

    return NextResponse.json({
      message: "Conversation created successfully",
      conversationId,
      messageId: initialMessage.id,
    });

  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
} 