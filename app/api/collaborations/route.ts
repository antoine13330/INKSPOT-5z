import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyOfflineUserForCollaboration } from "@/lib/offline-push-notifications";
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, proId, message } = await request.json();

    if (!postId || !proId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if post exists and user is the author
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if pro exists
    const pro = await prisma.user.findUnique({
      where: { id: proId, role: "PRO" },
    });

    if (!pro) {
      return NextResponse.json({ error: "Pro not found" }, { status: 404 });
    }

    // Check if collaboration already exists
    const existingCollaboration = await prisma.collaboration.findUnique({
      where: {
        postId_proId: {
          postId,
          proId,
        },
      },
    });

    if (existingCollaboration) {
      return NextResponse.json({ error: "Collaboration already exists" }, { status: 400 });
    }

    // Create collaboration
    const collaboration = await prisma.collaboration.create({
      data: {
        postId,
        proId,
        message,
      },
      include: {
        pro: {
          select: {
            id: true,
            username: true,
            businessName: true,
            avatar: true,
          },
        },
      },
    });

    // Create notification for the pro
    await prisma.notification.create({
      data: {
        title: "Collaboration Invitation",
        message: `You've been invited to collaborate on a post by ${post.author.username}`,
        type: "COLLABORATION_INVITE",
        userId: proId,
        data: {
          postId,
          collaborationId: collaboration.id,
          authorId: session.user.id,
          authorUsername: post.author.username,
        },
      },
    });

    // Send push notification if pro is offline
    try {
      await notifyOfflineUserForCollaboration(
        proId,
        session.user.id,
        {
          collaborationId: collaboration.id,
          postId
        }
      );
    } catch (error) {
      console.error("Error sending offline push notification:", error);
      // Ne pas faire échouer la création de collaboration si la notification push échoue
    }

    return NextResponse.json({ collaboration });
  } catch (error) {
    console.error("Error creating collaboration:", error);
    return NextResponse.json({ error: "Failed to create collaboration" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { collaborationId, status } = await request.json();

    if (!collaborationId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if collaboration exists and user is the invited pro
    const collaboration = await prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: {
        post: {
          include: { author: true },
        },
        pro: true,
      },
    });

    if (!collaboration) {
      return NextResponse.json({ error: "Collaboration not found" }, { status: 404 });
    }

    if (collaboration.proId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update collaboration status
    const updatedCollaboration = await prisma.collaboration.update({
      where: { id: collaborationId },
      data: { status },
      include: {
        post: {
          include: { author: true },
        },
        pro: true,
      },
    });

    // Create notification for the post author
    const notificationType = status === "ACCEPTED" ? "COLLABORATION_ACCEPTED" : "COLLABORATION_REJECTED";
    const notificationMessage = status === "ACCEPTED" 
      ? `${collaboration.pro.username} accepted your collaboration invitation`
      : `${collaboration.pro.username} declined your collaboration invitation`;

    await prisma.notification.create({
      data: {
        title: status === "ACCEPTED" ? "Collaboration Accepted" : "Collaboration Declined",
        message: notificationMessage,
        type: notificationType,
        userId: collaboration.post.authorId,
        data: {
          postId: collaboration.postId,
          collaborationId: collaboration.id,
          proId: collaboration.proId,
          proUsername: collaboration.pro.username,
        },
      },
    });

    return NextResponse.json({ collaboration: updatedCollaboration });
  } catch (error) {
    console.error("Error updating collaboration:", error);
    return NextResponse.json({ error: "Failed to update collaboration" }, { status: 500 });
  }
} 