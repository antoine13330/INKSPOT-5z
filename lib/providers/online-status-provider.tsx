"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface OnlineUser {
  id: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  lastActiveAt: string
  isOnline: boolean
}

interface OnlineStatusContextType {
  // État
  onlineUsers: OnlineUser[]
  isLoading: boolean
  
  // Actions
  refreshOnlineUsers: () => Promise<void>
  setUserOnline: (isOnline: boolean) => Promise<void>
  isUserOnline: (userId: string) => boolean
  getUserById: (userId: string) => OnlineUser | undefined
  
  // Statut de l'utilisateur actuel
  currentUserOnline: boolean
}

const OnlineStatusContext = createContext<OnlineStatusContextType | undefined>(undefined)

interface OnlineStatusProviderProps {
  children: React.ReactNode
}

export function OnlineStatusProvider({ children }: OnlineStatusProviderProps) {
  const { data: session, status } = useSession()
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserOnline, setCurrentUserOnline] = useState(false)

  // Récupérer la liste des utilisateurs en ligne
  const refreshOnlineUsers = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/users/online')
      if (response.ok) {
        const data = await response.json()
        setOnlineUsers(data.users || [])
        
        // Vérifier si l'utilisateur actuel est dans la liste
        const currentUserIsOnline = data.users?.some((user: OnlineUser) => user.id === session.user.id)
        setCurrentUserOnline(currentUserIsOnline || false)
      } else {
        console.error('Failed to fetch online users:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching online users:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, status])

  // Marquer l'utilisateur actuel comme en ligne/hors ligne
  const setUserOnline = useCallback(async (isOnline: boolean) => {
    if (status !== 'authenticated' || !session?.user?.id) {
      console.log('Cannot set user online: not authenticated')
      return
    }

    try {
      const response = await fetch('/api/users/online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline }),
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentUserOnline(isOnline)
        
        // Actualiser la liste seulement si on marque comme en ligne
        if (isOnline) {
          await refreshOnlineUsers()
        }
        
        console.log(`✅ User marked as ${isOnline ? 'online' : 'offline'}`)
      } else {
        const errorText = await response.text()
        console.error('Failed to update online status:', response.status, errorText)
        throw new Error(`Failed to update online status: ${response.status}`)
      }
    } catch (error) {
      console.error('Error updating online status:', error)
      // Ne plus afficher de toast pour éviter le spam d'erreurs
    }
  }, [session?.user?.id, status, refreshOnlineUsers])

  // Vérifier si un utilisateur est en ligne
  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.some(user => user.id === userId && user.isOnline)
  }, [onlineUsers])

  // Récupérer un utilisateur par son ID
  const getUserById = useCallback((userId: string): OnlineUser | undefined => {
    return onlineUsers.find(user => user.id === userId)
  }, [onlineUsers])

  // Marquer l'utilisateur comme en ligne lors de la connexion
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // Utiliser setTimeout pour éviter setState pendant le render
      const timer = setTimeout(() => {
        setUserOnline(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [status, session?.user?.id, setUserOnline])

  // Marquer l'utilisateur comme hors ligne lors de la fermeture de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session?.user?.id) {
        // Utiliser fetch avec keepalive pour une requête non-bloquante
        try {
          fetch('/api/users/online', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isOnline: false }),
            keepalive: true
          }).catch(() => {}) // Ignorer les erreurs silencieusement
        } catch (error) {
          // Fallback avec sendBeacon si fetch échoue
          try {
            const formData = new FormData()
            formData.append('isOnline', 'false')
            navigator.sendBeacon('/api/users/online', formData)
          } catch (e) {
            // Ignorer les erreurs silencieusement
          }
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [session?.user?.id])

  // Actualiser la liste périodiquement
  useEffect(() => {
    if (status !== 'authenticated') {
      setIsLoading(false)
      return
    }

    // Première récupération avec un délai pour éviter les problèmes de race condition
    const timer = setTimeout(() => {
      refreshOnlineUsers()
    }, 500)

    // Actualiser toutes les 30 secondes
    const interval = setInterval(refreshOnlineUsers, 30000)

    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [status, refreshOnlineUsers])

  // Heartbeat pour maintenir l'utilisateur en ligne
  useEffect(() => {
    if (status !== 'authenticated' || !currentUserOnline) return

    const heartbeat = setInterval(() => {
      setUserOnline(true) // Cela met à jour lastActiveAt
    }, 60000) // Toutes les minutes

    return () => clearInterval(heartbeat)
  }, [status, currentUserOnline, setUserOnline])

  const value: OnlineStatusContextType = {
    onlineUsers,
    isLoading,
    refreshOnlineUsers,
    setUserOnline,
    isUserOnline,
    getUserById,
    currentUserOnline
  }

  return (
    <OnlineStatusContext.Provider value={value}>
      {children}
    </OnlineStatusContext.Provider>
  )
}

// Hook pour utiliser le contexte
export function useOnlineStatus() {
  const context = useContext(OnlineStatusContext)
  if (context === undefined) {
    throw new Error('useOnlineStatus must be used within an OnlineStatusProvider')
  }
  return context
}

// Hook pour vérifier le statut d'un utilisateur spécifique
export function useUserOnlineStatus(userId: string) {
  const { isUserOnline, getUserById } = useOnlineStatus()
  
  // Protection contre les userId vides ou undefined
  if (!userId || userId.trim() === '') {
    return {
      isOnline: false,
      user: undefined
    }
  }
  
  return {
    isOnline: isUserOnline(userId),
    user: getUserById(userId)
  }
}
