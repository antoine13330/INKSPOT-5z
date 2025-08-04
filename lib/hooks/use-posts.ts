import { useCallback, useEffect } from 'react'
import { usePostsStore } from '@/lib/stores/posts-store'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useUIStore } from '@/lib/stores/ui-store'

// Hook for fetching and managing posts feed
export const usePosts = () => {
  const { isAuthenticated, user } = useAuthStore()
  const { showErrorToast } = useUIStore()
  
  const {
    publicPosts,
    recommendedPosts,
    searchResults,
    searchQuery,
    isLoading,
    isSearching,
    error,
    setPublicPosts,
    setRecommendedPosts,
    appendPosts,
    setSearchResults,
    setLoading,
    setSearching,
    setError,
    likePost,
    unlikePost,
    incrementViews,
    isPublicPostsCacheValid,
    isRecommendedPostsCacheValid,
    clearSearch,
  } = usePostsStore()

  // Fetch public posts
  const fetchPublicPosts = useCallback(async (refresh = false) => {
    if (!refresh && isPublicPostsCacheValid()) {
      return publicPosts.data
    }

    setLoading(true)
    try {
      const response = await fetch('/api/posts')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch posts')
      }
      
      setPublicPosts(data.posts || [], data.pagination?.hasMore, data.pagination?.page)
      return data.posts || []
    } catch (error: any) {
      setError(error.message)
      showErrorToast('Failed to load posts')
      return []
    }
  }, [isPublicPostsCacheValid, publicPosts.data, setLoading, setPublicPosts, setError, showErrorToast])

  // Fetch recommended posts
  const fetchRecommendedPosts = useCallback(async (refresh = false) => {
    if (!isAuthenticated || !user?.id) {
      return []
    }

    if (!refresh && isRecommendedPostsCacheValid()) {
      return recommendedPosts.data
    }

    setLoading(true)
    try {
      const response = await fetch('/api/posts/recommended')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch recommended posts')
      }
      
      setRecommendedPosts(data.posts || [], data.pagination?.hasMore, data.pagination?.page)
      return data.posts || []
    } catch (error: any) {
      setError(error.message)
      showErrorToast('Failed to load recommended posts')
      return []
    }
  }, [isAuthenticated, user?.id, isRecommendedPostsCacheValid, recommendedPosts.data, setLoading, setRecommendedPosts, setError, showErrorToast])

  // Load more posts (pagination)
  const loadMorePosts = useCallback(async (type: 'public' | 'recommended') => {
    const cache = type === 'public' ? publicPosts : recommendedPosts
    
    if (!cache.hasMore || isLoading) {
      return
    }

    setLoading(true)
    try {
      const endpoint = type === 'public' ? '/api/posts' : '/api/posts/recommended'
      const response = await fetch(`${endpoint}?page=${cache.page + 1}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load more posts')
      }
      
      appendPosts(data.posts || [], type)
    } catch (error: any) {
      setError(error.message)
      showErrorToast('Failed to load more posts')
    }
  }, [publicPosts, recommendedPosts, isLoading, setLoading, appendPosts, setError, showErrorToast])

  // Search posts
  const searchPosts = useCallback(async (query: string) => {
    if (!query.trim()) {
      clearSearch()
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Search failed')
      }
      
      setSearchResults(data.posts || [], query)
      
      // Record search in history
      if (isAuthenticated) {
        fetch('/api/search/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, type: 'posts' }),
        }).catch(() => {}) // Silent fail for history
      }
      
    } catch (error: any) {
      setError(error.message)
      showErrorToast('Search failed')
    }
  }, [clearSearch, setSearching, setSearchResults, setError, showErrorToast, isAuthenticated])

  // Like/unlike post with optimistic updates
  const toggleLike = useCallback(async (postId: string) => {
    if (!isAuthenticated || !user?.id) {
      showErrorToast('Please login to like posts')
      return
    }

    const post = [...publicPosts.data, ...recommendedPosts.data, ...searchResults]
      .find(p => p.id === postId)
    
    if (!post) return

    // Optimistic update
    if (post.liked) {
      unlikePost(postId, user.id)
    } else {
      likePost(postId, user.id)
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: post.liked ? 'DELETE' : 'POST',
      })
      
      if (!response.ok) {
        // Revert optimistic update on failure
        if (post.liked) {
          likePost(postId, user.id)
        } else {
          unlikePost(postId, user.id)
        }
        throw new Error('Failed to update like')
      }
    } catch (error: any) {
      showErrorToast('Failed to update like')
    }
  }, [isAuthenticated, user?.id, publicPosts.data, recommendedPosts.data, searchResults, likePost, unlikePost, showErrorToast])

  // Record post view
  const recordView = useCallback(async (postId: string) => {
    incrementViews(postId)
    
    // Send to backend (silent fail)
    if (isAuthenticated) {
      fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: 'post-view', // Special case for post views
          interactionType: 'view',
          postId,
        }),
      }).catch(() => {})
    }
  }, [incrementViews, isAuthenticated])

  // Auto-fetch posts on mount or auth change
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchRecommendedPosts()
    } else {
      fetchPublicPosts()
    }
  }, [isAuthenticated, user?.id, fetchRecommendedPosts, fetchPublicPosts])

  return {
    // Data
    posts: isAuthenticated ? recommendedPosts.data : publicPosts.data,
    publicPosts: publicPosts.data,
    recommendedPosts: recommendedPosts.data,
    searchResults,
    searchQuery,
    hasMorePosts: isAuthenticated ? recommendedPosts.hasMore : publicPosts.hasMore,
    
    // Loading states
    isLoading,
    isSearching,
    error,
    
    // Actions
    fetchPublicPosts,
    fetchRecommendedPosts,
    loadMorePosts,
    searchPosts,
    toggleLike,
    recordView,
    clearSearch,
    
    // Utilities
    refresh: () => isAuthenticated ? fetchRecommendedPosts(true) : fetchPublicPosts(true),
  }
}