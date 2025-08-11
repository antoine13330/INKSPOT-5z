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
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    // Search for PRO users (artists)
    const artists = await prisma.user.findMany({
      where: {
        role: "PRO",
        status: "ACTIVE",
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { businessName: { contains: query, mode: "insensitive" } },
          { specialties: { hasSome: query ? [query] : [] } },
        ],
      },
      select: {
        id: true,
        username: true,
        businessName: true,
        avatar: true,
        specialties: true,
        location: true,
        hourlyRate: true,
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
      },
      take: limit,
      orderBy: {
        profileViews: "desc",
      },
    });

    return NextResponse.json({
      artists: artists.map(artist => ({
        ...artist,
        displayName: artist.businessName || artist.username,
      })),
    });

  } catch (error) {
    console.error("Error searching artists:", error);
    return NextResponse.json(
      { error: "Failed to search artists" },
      { status: 500 }
    );
  }
} 