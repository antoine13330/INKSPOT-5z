import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AIRecommendationEngine } from "@/lib/recommendations-ai"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const includeLocation = searchParams.get("includeLocation") !== "false"
    const diversify = searchParams.get("diversify") !== "false"
    const minSimilarity = Number.parseFloat(searchParams.get("minSimilarity") || "0.1")

    const engine = AIRecommendationEngine.getInstance()
    
    const recommendations = await engine.getAIRecommendations({
      userId: session.user.id,
      limit: limit * page, // Get more to account for pagination
      includeLocation,
      minSimilarity,
      diversify,
    })

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedRecommendations = recommendations.slice(startIndex, endIndex)

    // Enhance with user data (the AI engine returns basic user info)
    const userIds = paginatedRecommendations.map(rec => rec.userId)
    
    // Get full user details with stats
    const { prisma } = await import("@/lib/prisma")
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            reviewsReceived: true,
          },
        },
        reviewsReceived: {
          select: { rating: true },
        },
        posts: {
          select: {
            id: true,
            likesCount: true,
            commentsCount: true,
            createdAt: true,
          },
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    // Combine recommendation scores with user data
    const enrichedUsers = users.map(user => {
      const recommendation = paginatedRecommendations.find(rec => rec.userId === user.id)
      const avgRating = user.reviewsReceived.length > 0 
        ? user.reviewsReceived.reduce((sum, review) => sum + review.rating, 0) / user.reviewsReceived.length
        : 0

      const totalEngagement = user.posts.reduce((sum, post) => sum + post.likesCount + post.commentsCount, 0)

      return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        role: user.role,
        verified: user.verified,
        businessName: user.businessName,
        specialties: user.specialties,
        hourlyRate: user.hourlyRate,
        portfolio: user.portfolio,
        profileViews: user.profileViews,
        lastActiveAt: user.lastActiveAt,
        stats: {
          followersCount: user._count.followers,
          followingCount: user._count.following,
          postsCount: user._count.posts,
          reviewsCount: user._count.reviewsReceived,
          avgRating: Math.round(avgRating * 10) / 10,
          totalEngagement,
        },
        recentPosts: user.posts,
        recommendationScore: recommendation,
      }
    })

    // Sort by recommendation score to maintain AI ordering
    enrichedUsers.sort((a, b) => (b.recommendationScore?.score || 0) - (a.recommendationScore?.score || 0))

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        hasMore: recommendations.length > endIndex,
        total: recommendations.length,
      },
      recommendations: {
        totalCandidates: recommendations.length,
        avgSimilarity: recommendations.length > 0 
          ? recommendations.reduce((sum, rec) => sum + rec.similarity, 0) / recommendations.length 
          : 0,
      },
    })
  } catch (error) {
    console.error("Error fetching user recommendations:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}