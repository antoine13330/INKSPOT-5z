import { useState, useEffect, useCallback } from 'react'
import { UseLocalStorageOptions } from '@/types'
import { setLocalStorageWithExpiry, getLocalStorageWithExpiry } from '@/lib/utils'

/**
 * Hook pour gérer le localStorage avec expiration
 */
export function useLocalStorageWithExpiry<T>(
  key: string,
  initialValue: T,
  ttl: number
) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = getLocalStorageWithExpiry(key)
      return item !== null ? item : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      setLocalStorageWithExpiry(key, valueToStore, ttl)
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue, ttl])

  return [storedValue, setValue] as const
}

/**
 * Hook pour gérer le localStorage standard
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
) {
  const {
    defaultValue,
    serializer = JSON.stringify,
    deserializer = JSON.parse
  } = options

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        return deserializer(item)
      }
      return defaultValue !== undefined ? defaultValue : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return defaultValue !== undefined ? defaultValue : initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, serializer(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue, serializer])

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

/**
 * Hook pour gérer les préférences utilisateur
 */
export function usePreferences() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark' | 'system'>(
    'theme',
    'system'
  )
  
  const [language, setLanguage] = useLocalStorage<string>(
    'language',
    'fr'
  )
  
  const [notifications, setNotifications] = useLocalStorage<boolean>(
    'notifications',
    true
  )
  
  const [sound, setSound] = useLocalStorage<boolean>(
    'sound',
    true
  )

  return {
    theme,
    setTheme,
    language,
    setLanguage,
    notifications,
    setNotifications,
    sound,
    setSound
  }
}

/**
 * Hook pour gérer l'historique de recherche
 */
export function useSearchHistory(maxItems = 10) {
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>(
    'searchHistory',
    []
  )

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return
    
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== query)
      const newHistory = [query, ...filtered].slice(0, maxItems)
      return newHistory
    })
  }, [setSearchHistory, maxItems])

  const removeFromHistory = useCallback((query: string) => {
    setSearchHistory(prev => prev.filter(item => item !== query))
  }, [setSearchHistory])

  const clearHistory = useCallback(() => {
    setSearchHistory([])
  }, [setSearchHistory])

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}

/**
 * Hook pour gérer les favoris
 */
export function useFavorites<T extends { id: string }>(key: string) {
  const [favorites, setFavorites] = useLocalStorage<T[]>(key, [])

  const addFavorite = useCallback((item: T) => {
    setFavorites(prev => {
      if (prev.some(fav => fav.id === item.id)) {
        return prev
      }
      return [...prev, item]
    })
  }, [setFavorites])

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => prev.filter(item => item.id !== id))
  }, [setFavorites])

  const isFavorite = useCallback((id: string) => {
    return favorites.some(item => item.id === id)
  }, [favorites])

  const toggleFavorite = useCallback((item: T) => {
    if (isFavorite(item.id)) {
      removeFavorite(item.id)
    } else {
      addFavorite(item)
    }
  }, [addFavorite, removeFavorite, isFavorite])

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite
  }
} 