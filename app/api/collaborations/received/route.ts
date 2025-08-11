import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth";
export const dynamic = "force-dynamic"
import { authOptions } from "@/lib/auth";
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic"

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