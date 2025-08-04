import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { Session } from 'next-auth'

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
}

interface AuthState {
  // State
  session: Session | null
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  updateUserProfile: (updates: Partial<User>) => void
  
  // Computed
  isPro: () => boolean
  isAdmin: () => boolean
  isClient: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      session: null,
      user: null,
      isLoading: true,
      isAuthenticated: false,

      // Actions
      setSession: (session) => set((state) => {
        state.session = session
        state.isAuthenticated = !!session
        state.isLoading = false
        
        // Extract user data from session if available
        if (session?.user) {
          state.user = {
            id: session.user.id,
            username: session.user.username || '',
            email: session.user.email || '',
            avatar: session.user.avatar,
            role: session.user.role || 'CLIENT',
            verified: session.user.verified || false,
            businessName: session.user.businessName,
            specialties: session.user.specialties,
            hourlyRate: session.user.hourlyRate,
            profileTheme: session.user.profileTheme,
            createdAt: session.user.createdAt || new Date().toISOString(),
          }
        } else {
          state.user = null
        }
      }),

      setUser: (user) => set((state) => {
        state.user = user
      }),

      setLoading: (loading) => set((state) => {
        state.isLoading = loading
      }),

      logout: () => set((state) => {
        state.session = null
        state.user = null
        state.isAuthenticated = false
        state.isLoading = false
      }),

      updateUserProfile: (updates) => set((state) => {
        if (state.user) {
          Object.assign(state.user, updates)
        }
        
        // Also update session if it exists
        if (state.session?.user) {
          Object.assign(state.session.user, updates)
        }
      }),

      // Computed properties
      isPro: () => get().user?.role === 'PRO',
      isAdmin: () => get().user?.role === 'ADMIN',
      isClient: () => get().user?.role === 'CLIENT',
    })),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist non-sensitive data
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)