import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get recommended posts with collaborations
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            businessName: true,
            avatar: true,
          },
        },
        collaborations: {
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
        },
      },
      orderBy: [
        { publishedAt: "desc" },
        { likesCount: "desc" },
        { viewsCount: "desc" },
      ],
      take: 50,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching recommended posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
