"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

export interface RecommendationScore {
  userId: string
  score: number
  reasons: string[]
  similarity: number
  engagement: number
  freshness: number
  location?: number
}

export interface RecommendedUser {
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
  specialties?: string[]
  hourlyRate?: number
  distance?: number
  stats: {
    followersCount: number
    followingCount: number
    postsCount: number
    reviewsCount: number
    avgRating: number
    totalEngagement: number
  }
  recommendationScore?: RecommendationScore
}

export interface RecommendedPost {
  id: string
  content: string
  images: string[]
  hashtags: string[]
  likesCount: number
  commentsCount: number
  viewsCount: number
  createdAt: string
  author: RecommendedUser
  liked: boolean
}

export interface UseRecommendationsOptions {
  limit?: number
  includeLocation?: boolean
  diversify?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseRecommendationsReturn {
  users: RecommendedUser[]
  posts: RecommendedPost[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

/**
 * Hook for AI-powered user recommendations
 */
export function useUserRecommendations(options: UseRecommendationsOptions = {}): UseRecommendationsReturn {
  const { data: session } = useSession()
  const {
    limit = 20,
    includeLocation = true,
    diversify = true,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options

  const [users, setUsers] = useState<RecommendedUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchRecommendations = useCallback(async (isLoadMore = false) => {
    if (!session?.user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const currentPage = isLoadMore ? page + 1 : 1
      const response = await fetch(`/api/recommendations/users?page=${currentPage}&limit=${limit}&includeLocation=${includeLocation}&diversify=${diversify}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      
      if (isLoadMore) {
        setUsers(prev => [...prev, ...data.users])
        setPage(currentPage)
      } else {
        setUsers(data.users)
        setPage(1)
      }
      
      setHasMore(data.users.length === limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, limit, includeLocation, diversify, page])

  const refresh = useCallback(() => fetchRecommendations(false), [fetchRecommendations])
  const loadMore = useCallback(() => fetchRecommendations(true), [fetchRecommendations])

  useEffect(() => {
    if (session?.user?.id) {
      fetchRecommendations()
    }
  }, [session?.user?.id, fetchRecommendations])

  useEffect(() => {
    if (autoRefresh && session?.user?.id) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, refresh, session?.user?.id])

  return {
    users,
    posts: [], // Not applicable for user recommendations
    isLoading,
    error,
    refresh,
    loadMore,
    hasMore
  }
}

/**
 * Hook for AI-powered post recommendations
 */
export function usePostRecommendations(options: UseRecommendationsOptions = {}): UseRecommendationsReturn {
  const { data: session } = useSession()
  const {
    limit = 20,
    diversify = true,
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options

  const [posts, setPosts] = useState<RecommendedPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchRecommendations = useCallback(async (isLoadMore = false) => {
    if (!session?.user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const currentPage = isLoadMore ? page + 1 : 1
      const response = await fetch(`/api/posts/recommended?page=${currentPage}&limit=${limit}&diversify=${diversify}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch post recommendations')
      }

      const data = await response.json()
      
      if (isLoadMore) {
        setPosts(prev => [...prev, ...data.posts])
        setPage(currentPage)
      } else {
        setPosts(data.posts)
        setPage(1)
      }
      
      setHasMore(data.posts.length === limit)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, limit, diversify, page])

  const refresh = useCallback(() => fetchRecommendations(false), [fetchRecommendations])
  const loadMore = useCallback(() => fetchRecommendations(true), [fetchRecommendations])

  useEffect(() => {
    if (session?.user?.id) {
      fetchRecommendations()
    }
  }, [session?.user?.id, fetchRecommendations])

  useEffect(() => {
    if (autoRefresh && session?.user?.id) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, refresh, session?.user?.id])

  return {
    users: [], // Not applicable for post recommendations
    posts,
    isLoading,
    error,
    refresh,
    loadMore,
    hasMore
  }
}

/**
 * Hook for geographic-based recommendations
 */
export function useGeographicRecommendations(
  location: string | { lat: number; lng: number },
  radius = 50,
  options: UseRecommendationsOptions = {}
): UseRecommendationsReturn {
  const { data: session } = useSession()
  const { limit = 20 } = options

  const [users, setUsers] = useState<RecommendedUser[]>([])
  const [posts, setPosts] = useState<RecommendedPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchGeographicRecommendations = useCallback(async () => {
    if (!location) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        radius: radius.toString(),
        limit: limit.toString(),
        contentType: 'both'
      })

      if (typeof location === 'string') {
        params.append('location', location)
      } else {
        params.append('lat', location.lat.toString())
        params.append('lng', location.lng.toString())
      }

      const response = await fetch(`/api/search/geographic?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch geographic recommendations')
      }

      const data = await response.json()
      setUsers(data.users || [])
      setPosts(data.posts || [])
      setHasMore(false) // Geographic search doesn't support pagination yet
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [location, radius, limit])

  const refresh = useCallback(() => fetchGeographicRecommendations(), [fetchGeographicRecommendations])

  useEffect(() => {
    if (location) {
      fetchGeographicRecommendations()
    }
  }, [location, fetchGeographicRecommendations])

  return {
    users,
    posts,
    isLoading,
    error,
    refresh,
    loadMore: async () => {}, // Not implemented for geographic search
    hasMore
  }
}

/**
 * Hook for search analytics and trending content
 */
export function useSearchAnalytics() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<{
    recentSearches: Array<{ query: string; createdAt: string }>
    popularHashtags: Array<{ tag: string; count: number }>
    trendingQueries: Array<{ query: string; count: number }>
  }>({
    recentSearches: [],
    popularHashtags: [],
    trendingQueries: []
  })
  const [isLoading, setIsLoading] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    try {
      const [recentResponse, trendingResponse] = await Promise.all([
        fetch('/api/search/history?limit=10'),
        fetch('/api/search/trending?limit=10')
      ])

      const recentData = await recentResponse.json()
      const trendingData = await trendingResponse.json()

      setAnalytics({
        recentSearches: recentData.searches || [],
        popularHashtags: trendingData.hashtags || [],
        trendingQueries: trendingData.queries || []
      })
    } catch (err) {
      console.error('Error fetching search analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  return {
    ...analytics,
    isLoading,
    refresh: fetchAnalytics
  }
}

/**
 * Hook for recording user interactions (for recommendation training)
 */
export function useInteractionTracking() {
  const { data: session } = useSession()

  const recordInteraction = useCallback(async (
    targetUserId: string,
    interactionType: 'view' | 'like' | 'comment' | 'message' | 'book',
    weight = 1
  ) => {
    if (!session?.user?.id || session.user.id === targetUserId) return

    try {
      await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUserId,
          interactionType,
          weight
        })
      })
    } catch (err) {
      console.error('Error recording interaction:', err)
    }
  }, [session?.user?.id])

  const recordPostView = useCallback((authorId: string) => {
    recordInteraction(authorId, 'view', 1)
  }, [recordInteraction])

  const recordPostLike = useCallback((authorId: string) => {
    recordInteraction(authorId, 'like', 3)
  }, [recordInteraction])

  const recordComment = useCallback((authorId: string) => {
    recordInteraction(authorId, 'comment', 5)
  }, [recordInteraction])

  const recordMessage = useCallback((targetUserId: string) => {
    recordInteraction(targetUserId, 'message', 7)
  }, [recordInteraction])

  const recordBooking = useCallback((proId: string) => {
    recordInteraction(proId, 'book', 10)
  }, [recordInteraction])

  return {
    recordInteraction,
    recordPostView,
    recordPostLike,
    recordComment,
    recordMessage,
    recordBooking
  }
}