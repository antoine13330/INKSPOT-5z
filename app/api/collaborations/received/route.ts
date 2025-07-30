import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collaborations = await prisma.collaboration.findMany({
      where: {
        proId: session.user.id,
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                businessName: true,
                avatar: true,
              },
            },
          },
        },
        pro: {
          select: {
            id: true,
            username: true,
            businessName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ collaborations });
  } catch (error) {
    console.error("Error fetching received collaborations:", error);
    return NextResponse.json({ error: "Failed to fetch collaborations" }, { status: 500 });
  }
} 