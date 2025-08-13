import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  email: string
  avatar?: string
  role: 'CLIENT' | 'PRO' | 'ADMIN'
  verified: boolean
  businessName?: string
  specialties?: string[]
  hourlyRate?: number
  profileTheme?: any
  createdAt: string
  lastSeen?: string
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
}

interface UserStats {
  totalBookings?: number
  completedBookings?: number
  totalRevenue?: number
  averageRating?: number
  reviewCount?: number
}

interface UsersCache {
  data: User[]
  lastFetch: number
  query?: string
}

interface UsersState {
  // Cache
  usersCache: Record<string, UsersCache> // keyed by cache type (all, pros, search results, etc.)
  userProfiles: Record<string, User> // individual user profiles
  userStats: Record<string, UserStats>
  
  // Search
  searchResults: User[]
  searchQuery: string
  searchFilters: {
    role?: 'CLIENT' | 'PRO' | 'ADMIN'
    verified?: boolean
    specialties?: string[]
    location?: string
    priceRange?: [number, number]
  }
  
  // UI State
  isLoading: boolean
  isSearching: boolean
  error: string | null
  
  // Actions
  setUsers: (users: User[], cacheKey: string, query?: string) => void
  appendUsers: (users: User[], cacheKey: string) => void
  setUserProfile: (user: User) => void
  setUserStats: (userId: string, stats: UserStats) => void
  updateUser: (userId: string, updates: Partial<User>) => void
  
  // Search actions
  setSearchResults: (users: User[], query: string) => void
  setSearchQuery: (query: string) => void
  setSearchFilters: (filters: Partial<UsersState['searchFilters']>) => void
  clearSearch: () => void
  
  // Loading states
  setLoading: (loading: boolean) => void
  setSearching: (searching: boolean) => void
  setError: (error: string | null) => void
  
  // Cache utilities
  isCacheValid: (cacheKey: string) => boolean
  getUserById: (userId: string) => User | undefined
  getUsersByRole: (role: 'CLIENT' | 'PRO' | 'ADMIN') => User[]
  getVerifiedPros: () => User[]
  clearCache: (cacheKey?: string) => void
}

const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes for user data

export const useUsersStore = create<UsersState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      usersCache: {},
      userProfiles: {},
      userStats: {},
      searchResults: [],
      searchQuery: '',
      searchFilters: {},
      isLoading: false,
      isSearching: false,
      error: null,

      // Actions
      setUsers: (users, cacheKey, query) => set((state) => {
        state.usersCache[cacheKey] = {
          data: users,
          lastFetch: Date.now(),
          query,
        }
        
        // Also update individual profiles
        users.forEach(user => {
          state.userProfiles[user.id] = user
        })
        
        state.isLoading = false
        state.error = null
      }),

      appendUsers: (users, cacheKey) => set((state) => {
        const cache = state.usersCache[cacheKey]
        if (cache) {
          const existingIds = new Set(cache.data.map(u => u.id))
          const newUsers = users.filter(u => !existingIds.has(u.id))
          
          cache.data.push(...newUsers)
          cache.lastFetch = Date.now()
          
          // Update individual profiles
          newUsers.forEach(user => {
            state.userProfiles[user.id] = user
          })
        }
        state.isLoading = false
      }),

      setUserProfile: (user) => set((state) => {
        state.userProfiles[user.id] = user
        
        // Also update in caches if present
        Object.values(state.usersCache).forEach(cache => {
          const index = cache.data.findIndex(u => u.id === user.id)
          if (index !== -1) {
            cache.data[index] = user
          }
        })
        
        // Update in search results
        const searchIndex = state.searchResults.findIndex(u => u.id === user.id)
        if (searchIndex !== -1) {
          state.searchResults[searchIndex] = user
        }
      }),

      setUserStats: (userId, stats) => set((state) => {
        state.userStats[userId] = stats
      }),

      updateUser: (userId, updates) => set((state) => {
        // Update in profiles
        if (state.userProfiles[userId]) {
          Object.assign(state.userProfiles[userId], updates)
        }
        
        // Update in all caches
        Object.values(state.usersCache).forEach(cache => {
          const user = cache.data.find(u => u.id === userId)
          if (user) {
            Object.assign(user, updates)
          }
        })
        
        // Update in search results
        const searchUser = state.searchResults.find(u => u.id === userId)
        if (searchUser) {
          Object.assign(searchUser, updates)
        }
      }),

      // Search actions
      setSearchResults: (users, query) => set((state) => {
        state.searchResults = users
        state.searchQuery = query
        state.isSearching = false
        
        // Cache individual profiles
        users.forEach(user => {
          state.userProfiles[user.id] = user
        })
      }),

      setSearchQuery: (query) => set((state) => {
        state.searchQuery = query
      }),

      setSearchFilters: (filters) => set((state) => {
        Object.assign(state.searchFilters, filters)
      }),

      clearSearch: () => set((state) => {
        state.searchResults = []
        state.searchQuery = ''
        state.searchFilters = {}
        state.isSearching = false
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
      isCacheValid: (cacheKey) => {
        const cache = get().usersCache[cacheKey]
        return cache && (Date.now() - cache.lastFetch) < CACHE_DURATION
      },

      getUserById: (userId) => {
        return get().userProfiles[userId]
      },

      getUsersByRole: (role) => {
        const state = get()
        return Object.values(state.userProfiles).filter(user => user.role === role)
      },

      getVerifiedPros: () => {
        const state = get()
        return Object.values(state.userProfiles).filter(
          user => user.role === 'PRO' && user.verified
        )
      },

      clearCache: (cacheKey) => set((state) => {
        if (cacheKey) {
          delete state.usersCache[cacheKey]
        } else {
          state.usersCache = {}
          state.userProfiles = {}
          state.userStats = {}
          state.searchResults = []
          state.searchQuery = ''
        }
      }),
    })),
    {
      name: 'users-storage',
      partialize: (state) => ({
        // Persist user profiles and some cache (with limits)
        userProfiles: Object.fromEntries(
          Object.entries(state.userProfiles).slice(0, 100) // Keep max 100 profiles
        ),
        userStats: state.userStats,
        // Don't persist search results or temporary cache
      }),
    }
  )
)