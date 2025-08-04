import { useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useUIStore } from '@/lib/stores/ui-store'
import { usePostsStore } from '@/lib/stores/posts-store'
import { useUsersStore } from '@/lib/stores/users-store'

export const useAuth = () => {
  const { data: session, status } = useSession()
  const { showSuccessToast, showErrorToast } = useUIStore()
  
  const {
    user,
    isLoading,
    isAuthenticated,
    setSession,
    setLoading,
    logout: logoutStore,
    updateUserProfile,
    isPro,
    isAdmin,
    isClient,
  } = useAuthStore()

  // Clear all stores on logout
  const { clearCache: clearPostsCache } = usePostsStore()
  const { clearCache: clearUsersCache } = useUsersStore()

  // Sync NextAuth session with Zustand store
  useEffect(() => {
    if (status === 'loading') {
      setLoading(true)
      return
    }

    setSession(session)
  }, [session, status, setSession, setLoading])

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        showErrorToast('Invalid credentials')
        return { success: false, error: result.error }
      }

      if (result?.ok) {
        showSuccessToast('Welcome back!')
        return { success: true }
      }

      return { success: false, error: 'Login failed' }
    } catch (error: any) {
      showErrorToast('Login failed')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Clear all stores first
      logoutStore()
      clearPostsCache()
      clearUsersCache()
      
      // Then sign out from NextAuth
      await signOut({ redirect: false })
      
      showSuccessToast('Logged out successfully')
      return { success: true }
    } catch (error: any) {
      showErrorToast('Logout failed')
      return { success: false, error: error.message }
    }
  }

  // Register function
  const register = async (userData: {
    firstName: string
    lastName: string
    username: string
    email: string
    password: string
    phone?: string
    location?: string
    bio?: string
    userType: 'CLIENT' | 'PRO'
    businessName?: string
    specialties?: string[]
    hourlyRate?: number
  }) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (!response.ok) {
        showErrorToast(data.message || 'Registration failed')
        return { success: false, error: data.message }
      }

      // Auto-login after successful registration
      const loginResult = await login(userData.email, userData.password)
      
      if (loginResult.success) {
        showSuccessToast('Account created successfully!')
      }
      
      return loginResult
    } catch (error: any) {
      showErrorToast('Registration failed')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Update profile function
  const updateProfile = async (updates: Partial<{
    username: string
    email: string
    avatar: string
    businessName: string
    specialties: string[]
    hourlyRate: number
    bio: string
    phone: string
    location: string
    profileTheme: any
  }>) => {
    if (!user?.id) {
      showErrorToast('Not authenticated')
      return { success: false, error: 'Not authenticated' }
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        showErrorToast(data.message || 'Update failed')
        return { success: false, error: data.message }
      }

      // Update store with new data
      updateUserProfile(data.user)
      showSuccessToast('Profile updated successfully')
      
      return { success: true, user: data.user }
    } catch (error: any) {
      showErrorToast('Update failed')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Fetch current user profile
  const fetchUserProfile = async () => {
    if (!user?.id) return null

    try {
      const response = await fetch(`/api/users/${user.id}`)
      const data = await response.json()

      if (response.ok && data.user) {
        updateUserProfile(data.user)
        return data.user
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
    
    return null
  }

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        showErrorToast(data.message || 'Failed to send reset email')
        return { success: false, error: data.message }
      }

      showSuccessToast('Password reset email sent')
      return { success: true }
    } catch (error: any) {
      showErrorToast('Failed to send reset email')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  // Check if user has permission
  const hasPermission = (permission: 'admin' | 'pro' | 'verified') => {
    if (!user) return false
    
    switch (permission) {
      case 'admin':
        return isAdmin()
      case 'pro':
        return isPro()
      case 'verified':
        return user.verified
      default:
        return false
    }
  }

  return {
    // User data
    user,
    session,
    isAuthenticated,
    isLoading: isLoading || status === 'loading',
    
    // User type checks
    isPro: isPro(),
    isAdmin: isAdmin(),
    isClient: isClient(),
    
    // Actions
    login,
    logout,
    register,
    updateProfile,
    fetchUserProfile,
    requestPasswordReset,
    
    // Utilities
    hasPermission,
    
    // Status
    authStatus: status,
  }
}