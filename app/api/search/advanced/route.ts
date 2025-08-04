import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export interface AdvancedSearchFilters {
  query?: string
  userType?: 'CLIENT' | 'PRO' | 'ADMIN'
  specialties?: string[]
  location?: string
  radius?: number // in km, for geographic search
  minRating?: number
  maxHourlyRate?: number
  minHourlyRate?: number
  hasPortfolio?: boolean
  verified?: boolean
  activeInDays?: number
  sortBy?: 'relevance' | 'rating' | 'price_low' | 'price_high' | 'recent' | 'popular'
  contentType?: 'posts' | 'users' | 'both'
  hashtags?: string[]
  dateFrom?: string
  dateTo?: string
  minEngagement?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const session = await getServerSession(authOptions)

    // Parse search filters
    const filters: AdvancedSearchFilters = {
      query: searchParams.get("q") || "",
      userType: (searchParams.get("userType") as 'CLIENT' | 'PRO' | 'ADMIN') || undefined,
      specialties: searchParams.get("specialties")?.split(",").filter(s => s.trim()) || [],
      location: searchParams.get("location") || undefined,
      radius: searchParams.get("radius") ? Number(searchParams.get("radius")) : undefined,
      minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
      maxHourlyRate: searchParams.get("maxHourlyRate") ? Number(searchParams.get("maxHourlyRate")) : undefined,
      minHourlyRate: searchParams.get("minHourlyRate") ? Number(searchParams.get("minHourlyRate")) : undefined,
      hasPortfolio: searchParams.get("hasPortfolio") === "true",
      verified: searchParams.get("verified") === "true",
      activeInDays: searchParams.get("activeInDays") ? Number(searchParams.get("activeInDays")) : undefined,
      sortBy: (searchParams.get("sortBy") as any) || "relevance",
      contentType: (searchParams.get("contentType") as 'posts' | 'users' | 'both') || "both",
      hashtags: searchParams.get("hashtags")?.split(",").filter(h => h.trim()) || [],
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      minEngagement: searchParams.get("minEngagement") ? Number(searchParams.get("minEngagement")) : undefined,
    }

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Log search for analytics
    if (session?.user?.id) {
      await logSearchAnalytics(session.user.id, filters)
    }

    let users: any[] = []
    let posts: any[] = []

    // Search users if requested
    if (filters.contentType === 'users' || filters.contentType === 'both') {
      users = await searchUsers(filters, skip, limit, session?.user?.id)
    }

    // Search posts if requested
    if (filters.contentType === 'posts' || filters.contentType === 'both') {
      posts = await searchPosts(filters, skip, limit, session?.user?.id)
    }

    return NextResponse.json({
      users,
      posts,
      filters: filters,
      pagination: {
        page,
        limit,
        hasMore: (users.length === limit) || (posts.length === limit),
      },
    })
  } catch (error) {
    console.error("Error in advanced search:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

async function searchUsers(
  filters: AdvancedSearchFilters,
  skip: number,
  limit: number,
  currentUserId?: string
): Promise<any[]> {
  const whereConditions: any = {
    status: 'ACTIVE',
  }

  // Text search
  if (filters.query && filters.query.trim()) {
    whereConditions.OR = [
      {
        username: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        firstName: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        lastName: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        businessName: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        bio: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
    ]
  }

  // User type filter
  if (filters.userType) {
    whereConditions.role = filters.userType
  }

  // Specialties filter
  if (filters.specialties && filters.specialties.length > 0) {
    whereConditions.specialties = {
      hasSome: filters.specialties,
    }
  }

  // Location filter (basic string matching)
  if (filters.location) {
    whereConditions.location = {
      contains: filters.location,
      mode: "insensitive",
    }
  }

  // Hourly rate filters
  if (filters.minHourlyRate !== undefined || filters.maxHourlyRate !== undefined) {
    whereConditions.hourlyRate = {}
    if (filters.minHourlyRate !== undefined) {
      whereConditions.hourlyRate.gte = filters.minHourlyRate
    }
    if (filters.maxHourlyRate !== undefined) {
      whereConditions.hourlyRate.lte = filters.maxHourlyRate
    }
  }

  // Portfolio filter
  if (filters.hasPortfolio) {
    whereConditions.portfolio = {
      not: {
        equals: [],
      },
    }
  }

  // Verified filter
  if (filters.verified) {
    whereConditions.verified = true
  }

  // Activity filter
  if (filters.activeInDays) {
    const activeDate = new Date()
    activeDate.setDate(activeDate.getDate() - filters.activeInDays)
    whereConditions.lastActiveAt = {
      gte: activeDate,
    }
  }

  // Build order by clause
  const orderBy = buildUserOrderBy(filters.sortBy)

  const users = await prisma.user.findMany({
    where: whereConditions,
    include: {
      posts: {
        select: {
          id: true,
          likesCount: true,
          commentsCount: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
          reviewsReceived: true,
        },
      },
      reviewsReceived: {
        select: {
          rating: true,
        },
      },
    },
    orderBy,
    skip,
    take: limit,
  })

  return users.map(user => {
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
    }
  })
}

async function searchPosts(
  filters: AdvancedSearchFilters,
  skip: number,
  limit: number,
  currentUserId?: string
): Promise<any[]> {
  const whereConditions: any = {
    status: 'PUBLISHED',
  }

  // Text search in content
  if (filters.query && filters.query.trim()) {
    whereConditions.OR = [
      {
        content: {
          contains: filters.query,
          mode: "insensitive",
        },
      },
      {
        author: {
          username: {
            contains: filters.query,
            mode: "insensitive",
          },
        },
      },
    ]
  }

  // Hashtags filter
  if (filters.hashtags && filters.hashtags.length > 0) {
    whereConditions.hashtags = {
      hasSome: filters.hashtags,
    }
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    whereConditions.createdAt = {}
    if (filters.dateFrom) {
      whereConditions.createdAt.gte = new Date(filters.dateFrom)
    }
    if (filters.dateTo) {
      whereConditions.createdAt.lte = new Date(filters.dateTo)
    }
  }

  // Minimum engagement filter
  if (filters.minEngagement) {
    whereConditions.OR = [
      ...(whereConditions.OR || []),
      {
        likesCount: {
          gte: filters.minEngagement,
        },
      },
      {
        commentsCount: {
          gte: Math.floor(filters.minEngagement / 2), // Comments are typically fewer
        },
      },
    ]
  }

  // Author filters
  const authorFilters: any = {}
  if (filters.userType) {
    authorFilters.role = filters.userType
  }
  if (filters.verified) {
    authorFilters.verified = true
  }
  if (filters.location) {
    authorFilters.location = {
      contains: filters.location,
      mode: "insensitive",
    }
  }
  if (filters.specialties && filters.specialties.length > 0) {
    authorFilters.specialties = {
      hasSome: filters.specialties,
    }
  }

  if (Object.keys(authorFilters).length > 0) {
    whereConditions.author = authorFilters
  }

  // Build order by clause
  const orderBy = buildPostOrderBy(filters.sortBy)

  const posts = await prisma.post.findMany({
    where: whereConditions,
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
          location: true,
        },
      },
      likes: currentUserId
        ? {
            where: {
              userId: currentUserId,
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
  })

  return posts.map(post => ({
    id: post.id,
    content: post.content,
    images: post.images,
    hashtags: post.hashtags,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    viewsCount: post.viewsCount,
    createdAt: post.createdAt.toISOString(),
    author: post.author,
    liked: currentUserId ? post.likes.length > 0 : false,
  }))
}

function buildUserOrderBy(sortBy?: string): any {
  switch (sortBy) {
    case 'rating':
      // This is complex with aggregations, so we'll sort by profile views for now
      return [{ profileViews: 'desc' }, { createdAt: 'desc' }]
    case 'price_low':
      return [{ hourlyRate: 'asc' }, { createdAt: 'desc' }]
    case 'price_high':
      return [{ hourlyRate: 'desc' }, { createdAt: 'desc' }]
    case 'recent':
      return [{ lastActiveAt: 'desc' }, { createdAt: 'desc' }]
    case 'popular':
      return [{ profileViews: 'desc' }, { createdAt: 'desc' }]
    default: // relevance
      return [{ lastActiveAt: 'desc' }, { profileViews: 'desc' }]
  }
}

function buildPostOrderBy(sortBy?: string): any {
  switch (sortBy) {
    case 'recent':
      return [{ createdAt: 'desc' }]
    case 'popular':
      return [{ likesCount: 'desc' }, { commentsCount: 'desc' }, { createdAt: 'desc' }]
    case 'rating':
      return [{ likesCount: 'desc' }, { viewsCount: 'desc' }, { createdAt: 'desc' }]
    default: // relevance
      return [{ createdAt: 'desc' }, { likesCount: 'desc' }]
  }
}

async function logSearchAnalytics(userId: string, filters: AdvancedSearchFilters) {
  try {
    // Create search history entry
    if (filters.query && filters.query.trim()) {
      await prisma.searchHistory.create({
        data: {
          userId,
          query: filters.query,
          hashtags: filters.hashtags || [],
        },
      })
    }

    // Log advanced search analytics (could be expanded to track filter usage)
    // This could be stored in a separate analytics table in the future
  } catch (error) {
    console.error("Error logging search analytics:", error)
  }
}