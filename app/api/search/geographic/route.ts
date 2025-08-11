import { type NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
import { getServerSession } from "next-auth"
export const dynamic = "force-dynamic"
import { authOptions } from "@/lib/auth"
export const dynamic = "force-dynamic"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

interface GeographicSearchParams {
  latitude?: number
  longitude?: number
  location?: string
  radius: number // in kilometers
  userType?: 'CLIENT' | 'PRO' | 'ADMIN'
  specialties?: string[]
  contentType?: 'posts' | 'users' | 'both'
}

interface LocationCoords {
  lat: number
  lng: number
}

// Major cities with their coordinates for basic geocoding
const CITY_COORDINATES: Record<string, LocationCoords> = {
  // France
  'paris': { lat: 48.8566, lng: 2.3522 },
  'marseille': { lat: 43.2965, lng: 5.3698 },
  'lyon': { lat: 45.7640, lng: 4.8357 },
  'toulouse': { lat: 43.6047, lng: 1.4442 },
  'nice': { lat: 43.7102, lng: 7.2620 },
  'nantes': { lat: 47.2184, lng: -1.5536 },
  'strasbourg': { lat: 48.5734, lng: 7.7521 },
  'montpellier': { lat: 43.6110, lng: 3.8767 },
  'bordeaux': { lat: 44.8378, lng: -0.5792 },
  'lille': { lat: 50.6292, lng: 3.0573 },
  
  // Other major cities
  'london': { lat: 51.5074, lng: -0.1278 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'brussels': { lat: 50.8503, lng: 4.3517 },
  'zurich': { lat: 47.3769, lng: 8.5417 },
  'geneva': { lat: 46.2044, lng: 6.1432 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'milan': { lat: 45.4642, lng: 9.1900 },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const session = await getServerSession(authOptions)

    const params: GeographicSearchParams = {
      latitude: searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined,
      longitude: searchParams.get("lng") ? Number(searchParams.get("lng")) : undefined,
      location: searchParams.get("location") || undefined,
      radius: Number(searchParams.get("radius")) || 50, // Default 50km
      userType: (searchParams.get("userType") as any) || undefined,
      specialties: searchParams.get("specialties")?.split(",").filter(s => s.trim()) || [],
      contentType: (searchParams.get("contentType") as any) || "both",
    }

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Determine coordinates
    let searchCoords: LocationCoords | null = null

    if (params.latitude && params.longitude) {
      searchCoords = { lat: params.latitude, lng: params.longitude }
    } else if (params.location) {
      searchCoords = geocodeLocation(params.location)
    }

    if (!searchCoords) {
      return NextResponse.json(
        { message: "Location coordinates or valid location name required" },
        { status: 400 }
      )
    }

    let users: unknown[] = []
    let posts: unknown[] = []

    // Search users if requested
    if (params.contentType === 'users' || params.contentType === 'both') {
      users = await searchUsersByLocation(params, searchCoords, skip, limit, session?.user?.id)
    }

    // Search posts if requested
    if (params.contentType === 'posts' || params.contentType === 'both') {
      posts = await searchPostsByLocation(params, searchCoords, skip, limit, session?.user?.id)
    }

    return NextResponse.json({
      users,
      posts,
      searchLocation: {
        coordinates: searchCoords,
        radius: params.radius,
        location: params.location,
      },
      pagination: {
        page,
        limit,
        hasMore: (users.length === limit) || (posts.length === limit),
      },
    })
  } catch (error) {
    console.error("Error in geographic search:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

async function searchUsersByLocation(
  params: GeographicSearchParams,
  searchCoords: LocationCoords,
  skip: number,
  limit: number,
  currentUserId?: string
): Promise<unknown[]> {
  // Get all users with locations
  const allUsers = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      location: { not: null },
      role: params.userType || undefined,
      specialties: params.specialties && params.specialties.length > 0 ? {
        hasSome: params.specialties
      } : undefined,
    },
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
        select: {
          rating: true,
        },
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

  // Filter by distance and calculate distances
  const usersWithDistance = allUsers
    .map(user => {
      const userCoords = geocodeLocation(user.location!)
      if (!userCoords) return null

      const distance = calculateDistance(searchCoords, userCoords)
      
      if (distance <= params.radius) {
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
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          coordinates: userCoords,
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
      }
      return null
    })
    .filter(user => user !== null)
    .sort((a, b) => (a?.distance || 0) - (b?.distance || 0)) // Sort by distance

  return usersWithDistance.slice(skip, skip + limit)
}

async function searchPostsByLocation(
  params: GeographicSearchParams,
  searchCoords: LocationCoords,
  skip: number,
  limit: number,
  currentUserId?: string
): Promise<unknown[]> {
  // Get all posts with author locations
  const allPosts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      author: {
        location: { not: null },
        role: params.userType || undefined,
        specialties: params.specialties && params.specialties.length > 0 ? {
          hasSome: params.specialties
        } : undefined,
      },
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
    orderBy: [
      { createdAt: 'desc' },
      { likesCount: 'desc' },
    ],
  })

  // Filter by distance and calculate distances
  const postsWithDistance = allPosts
    .map(post => {
      const authorCoords = geocodeLocation(post.author.location!)
      if (!authorCoords) return null

      const distance = calculateDistance(searchCoords, authorCoords)
      
      if (distance <= params.radius) {
        return {
          id: post.id,
          content: post.content,
          images: post.images,
          hashtags: post.hashtags,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
          viewsCount: post.viewsCount,
          createdAt: post.createdAt.toISOString(),
          author: {
            ...post.author,
            distance: Math.round(distance * 10) / 10,
            coordinates: authorCoords,
          },
          liked: currentUserId ? post.likes.length > 0 : false,
          distance: Math.round(distance * 10) / 10,
        }
      }
      return null
    })
    .filter(post => post !== null)
    .sort((a, b) => (a?.distance || 0) - (b?.distance || 0)) // Sort by distance

  return postsWithDistance.slice(skip, skip + limit)
}

function geocodeLocation(location: string): LocationCoords | null {
  if (!location) return null

  // Clean and normalize location string
  const cleanLocation = location.toLowerCase().trim()
  
  // Try exact match first
  if (CITY_COORDINATES[cleanLocation]) {
    return CITY_COORDINATES[cleanLocation]
  }

  // Try partial matches
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (cleanLocation.includes(city) || city.includes(cleanLocation)) {
      return coords
    }
  }

  // Try to extract city from comma-separated location (e.g., "Paris, France")
  const parts = cleanLocation.split(',').map(part => part.trim())
  for (const part of parts) {
    if (CITY_COORDINATES[part]) {
      return CITY_COORDINATES[part]
    }
  }

  return null
}

function calculateDistance(coords1: LocationCoords, coords2: LocationCoords): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(coords2.lat - coords1.lat)
  const dLng = toRadians(coords2.lng - coords1.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coords1.lat)) * Math.cos(toRadians(coords2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c // Distance in kilometers
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { location, latitude, longitude } = body

    // Update user's location
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        location: location || `${latitude},${longitude}`,
      },
    })

    return NextResponse.json({ message: "Location updated successfully" })
  } catch (error) {
    console.error("Error updating location:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}