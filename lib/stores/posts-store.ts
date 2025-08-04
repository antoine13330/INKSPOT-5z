import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'

interface PostAuthor {
  id: string
  username: string
  avatar?: string
  role: string
  verified: boolean
  businessName?: string
  specialties?: string[]
  hourlyRate?: number
  profileTheme?: any
}

interface Post {
  id: string
  content: string
  images: string[]
  hashtags: string[]
  likesCount: number
  commentsCount: number
  viewsCount: number
  createdAt: string
  author: PostAuthor
  liked: boolean
}

interface PostsCache {
  data: Post[]
  lastFetch: number
  hasMore: boolean
  page: number
}

interface PostsState {
  // Cache for different post types
  publicPosts: PostsCache
  recommendedPosts: PostsCache
  searchResults: Post[]
  searchQuery: string
  
  // UI State
  isLoading: boolean
  isSearching: boolean
  error: string | null
  
  // Actions
  setPublicPosts: (posts: Post[], hasMore?: boolean, page?: number) => void
  setRecommendedPosts: (posts: Post[], hasMore?: boolean, page?: number) => void
  appendPosts: (posts: Post[], type: 'public' | 'recommended') => void
  setSearchResults: (posts: Post[], query: string) => void
  clearSearch: () => void
  
  // Post actions
  likePost: (postId: string, userId: string) => void
  unlikePost: (postId: string, userId: string) => void
  incrementViews: (postId: string) => void
  addNewPost: (post: Post) => void
  
  // Loading states
  setLoading: (loading: boolean) => void
  setSearching: (searching: boolean) => void
  setError: (error: string | null) => void
  
  // Cache utilities
  isPublicPostsCacheValid: () => boolean
  isRecommendedPostsCacheValid: () => boolean
  getPostById: (postId: string) => Post | undefined
  clearCache: () => void
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const initialCache: PostsCache = {
  data: [],
  lastFetch: 0,
  hasMore: true,
  page: 1,
}

export const usePostsStore = create<PostsState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      publicPosts: initialCache,
      recommendedPosts: initialCache,
      searchResults: [],
      searchQuery: '',
      isLoading: false,
      isSearching: false,
      error: null,

      // Actions
      setPublicPosts: (posts, hasMore = true, page = 1) => set((state) => {
        state.publicPosts = {
          data: posts,
          lastFetch: Date.now(),
          hasMore,
          page,
        }
        state.isLoading = false
        state.error = null
      }),

      setRecommendedPosts: (posts, hasMore = true, page = 1) => set((state) => {
        state.recommendedPosts = {
          data: posts,
          lastFetch: Date.now(),
          hasMore,
          page,
        }
        state.isLoading = false
        state.error = null
      }),

      appendPosts: (posts, type) => set((state) => {
        const cache = type === 'public' ? state.publicPosts : state.recommendedPosts
        const existingIds = new Set(cache.data.map(p => p.id))
        const newPosts = posts.filter(p => !existingIds.has(p.id))
        
        cache.data.push(...newPosts)
        cache.lastFetch = Date.now()
        cache.page += 1
        cache.hasMore = posts.length > 0
        
        state.isLoading = false
      }),

      setSearchResults: (posts, query) => set((state) => {
        state.searchResults = posts
        state.searchQuery = query
        state.isSearching = false
      }),

      clearSearch: () => set((state) => {
        state.searchResults = []
        state.searchQuery = ''
        state.isSearching = false
      }),

      // Post actions with optimistic updates
      likePost: (postId, userId) => set((state) => {
        const updatePost = (post: Post) => {
          if (post.id === postId && !post.liked) {
            post.liked = true
            post.likesCount += 1
          }
        }

        state.publicPosts.data.forEach(updatePost)
        state.recommendedPosts.data.forEach(updatePost)
        state.searchResults.forEach(updatePost)
      }),

      unlikePost: (postId, userId) => set((state) => {
        const updatePost = (post: Post) => {
          if (post.id === postId && post.liked) {
            post.liked = false
            post.likesCount = Math.max(0, post.likesCount - 1)
          }
        }

        state.publicPosts.data.forEach(updatePost)
        state.recommendedPosts.data.forEach(updatePost)
        state.searchResults.forEach(updatePost)
      }),

      incrementViews: (postId) => set((state) => {
        const updatePost = (post: Post) => {
          if (post.id === postId) {
            post.viewsCount += 1
          }
        }

        state.publicPosts.data.forEach(updatePost)
        state.recommendedPosts.data.forEach(updatePost)
        state.searchResults.forEach(updatePost)
      }),

      addNewPost: (post) => set((state) => {
        // Add to the beginning of both caches
        state.publicPosts.data.unshift(post)
        state.recommendedPosts.data.unshift(post)
      }),

      // Loading states
      setLoading: (loading) => set((state) => {
        state.isLoading = loading
      }),

      setSearching: (searching) => set((state) => {
        state.isSearching = searching
      }),

      setError: (error) => set((state) => {
        state.error = error
        state.isLoading = false
        state.isSearching = false
      }),

      // Cache utilities
      isPublicPostsCacheValid: () => {
        const cache = get().publicPosts
        return cache.data.length > 0 && (Date.now() - cache.lastFetch) < CACHE_DURATION
      },

      isRecommendedPostsCacheValid: () => {
        const cache = get().recommendedPosts
        return cache.data.length > 0 && (Date.now() - cache.lastFetch) < CACHE_DURATION
      },

      getPostById: (postId) => {
        const state = get()
        return [...state.publicPosts.data, ...state.recommendedPosts.data, ...state.searchResults]
          .find(post => post.id === postId)
      },

      clearCache: () => set((state) => {
        state.publicPosts = initialCache
        state.recommendedPosts = initialCache
        state.searchResults = []
        state.searchQuery = ''
      }),
    })),
    {
      name: 'posts-storage',
      partialize: (state) => ({
        // Persist cache but with size limits
        publicPosts: {
          ...state.publicPosts,
          data: state.publicPosts.data.slice(0, 50), // Keep only first 50 posts
        },
        recommendedPosts: {
          ...state.recommendedPosts,
          data: state.recommendedPosts.data.slice(0, 50),
        },
      }),
    }
  )
)