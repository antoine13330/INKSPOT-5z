import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const tags = searchParams.get("tags")?.split(",") || [];
    const role = searchParams.get("role") || "PRO"; // Default to PRO (artists)
    const sortBy = searchParams.get("sortBy") || "popularity"; // popularity, date, name
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const session = await getServerSession(authOptions);

    if (!query.trim() && tags.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Build search conditions
    const searchConditions: any[] = [];

    // Search by username
    if (query.trim()) {
      searchConditions.push({
        username: {
          contains: query,
          mode: "insensitive",
        },
      });
    }

    // Search by business name
    if (query.trim()) {
      searchConditions.push({
        businessName: {
          contains: query,
          mode: "insensitive",
        },
      });
    }

    // Search by bio
    if (query.trim()) {
      searchConditions.push({
        bio: {
          contains: query,
          mode: "insensitive",
        },
      });
    }

    // Search by specialties (tags)
    if (tags.length > 0) {
      searchConditions.push({
        specialties: {
          hasSome: tags,
        },
      });
    }

    // Determine sort order
    let orderBy: any[] = [];
    switch (sortBy) {
      case "popularity":
        orderBy = [
          { profileViews: "desc" },
          { username: "asc" },
        ];
        break;
      case "date":
        orderBy = [
          { createdAt: "desc" },
          { username: "asc" },
        ];
        break;
      case "name":
        orderBy = [
          { username: "asc" },
        ];
        break;
      default:
        orderBy = [
          { profileViews: "desc" },
          { username: "asc" },
        ];
    }

    const users = await prisma.user.findMany({
      where: {
        role: role as any,
        status: "ACTIVE",
        OR: searchConditions.length > 0 ? searchConditions : undefined,
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        location: true,
        verified: true,
        role: true,
        businessName: true,
        specialties: true,
        hourlyRate: true,
        profileViews: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      verified: user.verified,
      role: user.role,
      businessName: user.businessName,
      specialties: user.specialties,
      hourlyRate: user.hourlyRate,
      profileViews: user.profileViews,
      postsCount: user._count.posts,
      followersCount: user._count.followers,
      createdAt: user.createdAt.toISOString(),
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        hasMore: users.length === limit,
      },
    });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
} 