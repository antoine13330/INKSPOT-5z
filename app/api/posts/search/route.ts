import { type NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
export const dynamic = "force-dynamic"
import { authOptions } from "@/lib/auth"
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const tags = searchParams.get("tags")?.split(",") || [];
    const sortBy = searchParams.get("sortBy") || "date"; // date, popularity, likes
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const session = await getServerSession(authOptions);

    if (!query.trim() && tags.length === 0) {
      return NextResponse.json({ posts: [] });
    }

    // Extract hashtags from query
    const hashtagRegex = /#[\w]+/g;
    const hashtags = query.match(hashtagRegex) || [];
    const textQuery = query.replace(hashtagRegex, "").trim();

    // Build search conditions
    const searchConditions: unknown[] = [];

    // Search by hashtags from query
    if (hashtags.length > 0) {
      searchConditions.push({
        hashtags: {
          hasSome: hashtags,
        },
      });
    }

    // Search by specific tags parameter
    if (tags.length > 0) {
      searchConditions.push({
        hashtags: {
          hasSome: tags,
        },
      });
    }

    // Search by content
    if (textQuery) {
      searchConditions.push({
        content: {
          contains: textQuery,
          mode: "insensitive",
        },
      });
    }

    // Search by author username
    if (textQuery) {
      searchConditions.push({
        author: {
          username: {
            contains: textQuery,
            mode: "insensitive",
          },
        },
      });
    }

    // Determine sort order
    let orderBy: unknown[] = [];
    switch (sortBy) {
      case "popularity":
        orderBy = [
          { viewsCount: "desc" },
          { likesCount: "desc" },
          { createdAt: "desc" },
        ];
        break;
      case "likes":
        orderBy = [
          { likesCount: "desc" },
          { createdAt: "desc" },
        ];
        break;
      case "date":
      default:
        orderBy = [
          { createdAt: "desc" },
        ];
        break;
    }

    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        OR: searchConditions.length > 0 ? searchConditions : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
            verified: true,
            businessName: true,
            specialties: true,
            hourlyRate: true,
            profileTheme: true,
          },
        },
        likes: session?.user?.id
          ? {
              where: {
                userId: session.user.id,
              },
            }
          : false,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Update view counts
    if (posts.length > 0) {
      await prisma.post.updateMany({
        where: {
          id: {
            in: posts.map((p) => p.id),
          },
        },
        data: {
          viewsCount: {
            increment: 1,
          },
        },
      })
    }

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      images: post.images,
      hashtags: post.hashtags,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      viewsCount: post.viewsCount + 1, // Include the increment
      createdAt: post.createdAt.toISOString(),
      author: post.author,
      liked: session?.user?.id ? post.likes.length > 0 : false,
    }))

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    })
  } catch (error) {
    console.error("Error searching posts:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
