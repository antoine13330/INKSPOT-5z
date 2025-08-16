import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
export const dynamic = "force-dynamic"


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

    let users: unknown[] = []
    let posts: unknown[] = []

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

// Type for Prisma where conditions
interface UserWhereConditions {
  status: Prisma.UserWhereInput['status']
  OR?: Array<{
    username?: { contains: string; mode: Prisma.QueryMode }
    firstName?: { contains: string; mode: Prisma.QueryMode }
    lastName?: { contains: string; mode: Prisma.QueryMode }
    businessName?: { contains: string; mode: Prisma.QueryMode }
    bio?: { contains: string; mode: Prisma.QueryMode }
  }>
  role?: Prisma.UserWhereInput['role']
  specialties?: { hasSome: string[] }
  location?: { contains: string; mode: Prisma.QueryMode }
  hourlyRate?: { gte?: number; lte?: number }
  portfolio?: Prisma.StringNullableListFilter<"User">
  verified?: boolean
  lastActiveAt?: { gte: Date }
}

async function searchUsers(
  filters: AdvancedSearchFilters,
  skip: number,
  limit: number,
  currentUserId?: string
): Promise<unknown[]> {
  const whereConditions: UserWhereConditions = {
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
      isEmpty: false,
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
          receivedReviews: true,
        },
      },
      receivedReviews: {
        select: {
          rating: true,
        },
      },
    },
    orderBy,
    skip,
    take: limit,
  })

  return users.map((user: any) => {
    const avgRating = user.receivedReviews.length > 0 
      ? user.receivedReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / user.receivedReviews.length
      : 0

    const totalEngagement = user.posts.reduce((sum: number, post: any) => sum + post.likesCount + post.commentsCount, 0)

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
        reviewsCount: user._count.receivedReviews,
        avgRating: Math.round(avgRating * 10) / 10,
        totalEngagement,
      },
      recentPosts: user.posts,
    }
  })
}

// Type for post where conditions
interface PostWhereConditions {
  status: Prisma.PostWhereInput['status']
  OR?: Array<{
    content?: { contains: string; mode: Prisma.QueryMode }
    author?: { username: { contains: string; mode: Prisma.QueryMode } }
    likesCount?: { gte: number }
    commentsCount?: { gte: number }
  }>
  hashtags?: { hasSome: string[] }
  createdAt?: { gte?: Date; lte?: Date }
  author?: { role?: Prisma.UserWhereInput['role']; verified?: boolean; location?: { contains: string; mode: Prisma.QueryMode } }
}

// Type for author filters
interface AuthorFilters {
  role?: Prisma.UserWhereInput['role']
  verified?: boolean
  location?: { contains: string; mode: Prisma.QueryMode }
}

async function searchPosts(
  filters: AdvancedSearchFilters,
  skip: number,
  limit: number,
  currentUserId?: string
): Promise<unknown[]> {
  const whereConditions: PostWhereConditions = {
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
  if (filters.userType || filters.verified || filters.location) {
    const authorFilters: AuthorFilters = {}
    
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

    if (Object.keys(authorFilters).length > 0) {
      whereConditions.author = authorFilters
    }
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

  return posts.map((post: any) => ({
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

function buildUserOrderBy(sortBy?: string): Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[] {
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

function buildPostOrderBy(sortBy?: string): Prisma.PostOrderByWithRelationInput | Prisma.PostOrderByWithRelationInput[] {
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

// Type for user with include fields from Prisma query
interface UserWithStats {
  id: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  bio?: string
  location?: string
  role: string
  verified: boolean
  businessName?: string
  specialties: string[]
  hourlyRate?: number
  portfolio: string[]
  profileViews?: number
  lastActiveAt?: string
  _count: {
    followers: number
    following: number
    posts: number
    reviewsReceived: number
  }
  reviewsReceived: Array<{ rating: number }>
  posts: Array<{
    id: string
    likesCount: number
    commentsCount: number
    createdAt: string
  }>
}

// Type for post with include fields from Prisma query
interface PostWithStats {
  id: string
  content: string
  images: string[]
  hashtags: string[]
  viewsCount: number
  createdAt: Date
  author: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
    role: string
    verified: boolean
  }
  _count: {
    likes: number
    comments: number
  }
  likes: Array<{ userId: string }>
}