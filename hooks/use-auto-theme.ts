"use client"

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

interface AutoThemeConfig {
  lightStart: number // Heure de début du mode clair (ex: 6 pour 6h)
  lightEnd: number   // Heure de fin du mode clair (ex: 18 pour 18h)
  checkInterval: number // Intervalle de vérification en minutes
}

const defaultConfig: AutoThemeConfig = {
  lightStart: 6,   // 6h du matin
  lightEnd: 18,    // 18h du soir
  checkInterval: 30 // Vérification toutes les 30 minutes
}

export function useAutoTheme(config: Partial<AutoThemeConfig> = {}) {
  const { theme, setTheme } = useTheme()
  const [isAutoMode, setIsAutoMode] = useState(false)
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours())
  
  const finalConfig = { ...defaultConfig, ...config }

  const shouldBeLightTheme = (hour: number) => {
    return hour >= finalConfig.lightStart && hour < finalConfig.lightEnd
  }

  const updateThemeBasedOnTime = () => {
    const now = new Date()
    const hour = now.getHours()
    setCurrentHour(hour)

    if (isAutoMode) {
      const newTheme = shouldBeLightTheme(hour) ? 'light' : 'dark'
      if (theme !== newTheme) {
        setTheme(newTheme)
        
        // Notification optionnelle
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Thème automatique', {
            body: `Changement automatique vers le mode ${newTheme === 'light' ? 'clair' : 'sombre'}`,
            icon: '/favicon.ico',
            tag: 'theme-change'
          })
        }
      }
    }
  }

  const enableAutoMode = () => {
    setIsAutoMode(true)
    updateThemeBasedOnTime()
    
    // Sauvegarder la préférence
    localStorage.setItem('auto-theme-enabled', 'true')
    localStorage.setItem('auto-theme-config', JSON.stringify(finalConfig))
  }

  const disableAutoMode = () => {
    setIsAutoMode(false)
    localStorage.setItem('auto-theme-enabled', 'false')
  }

  const updateConfig = (newConfig: Partial<AutoThemeConfig>) => {
    Object.assign(finalConfig, newConfig)
    localStorage.setItem('auto-theme-config', JSON.stringify(finalConfig))
    
    if (isAutoMode) {
      updateThemeBasedOnTime()
    }
  }

  // Initialisation et récupération des préférences sauvegardées
  useEffect(() => {
    try {
      const savedAutoMode = localStorage.getItem('auto-theme-enabled')
      const savedConfig = localStorage.getItem('auto-theme-config')
      
      if (savedAutoMode === 'true') {
        setIsAutoMode(true)
      }
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig)
        Object.assign(finalConfig, parsedConfig)
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des préférences de thème:', error)
    }
  }, [])

  // Interval pour vérifier l'heure régulièrement
  useEffect(() => {
    if (!isAutoMode) return

    updateThemeBasedOnTime()

    const interval = setInterval(
      updateThemeBasedOnTime,
      finalConfig.checkInterval * 60 * 1000 // Conversion en millisecondes
    )

    return () => clearInterval(interval)
  }, [isAutoMode, finalConfig.checkInterval])

  // Écouter les changements de visibilité pour mettre à jour immédiatement
  useEffect(() => {
    if (!isAutoMode) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateThemeBasedOnTime()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAutoMode])

  const getTimeUntilNextChange = () => {
    const now = new Date()
    const hour = now.getHours()
    const isCurrentlyLight = shouldBeLightTheme(hour)
    
    let nextChangeHour: number
    if (isCurrentlyLight) {
      nextChangeHour = finalConfig.lightEnd
    } else {
      nextChangeHour = hour < finalConfig.lightStart ? finalConfig.lightStart : finalConfig.lightStart + 24
    }
    
    const nextChange = new Date()
    nextChange.setHours(nextChangeHour % 24, 0, 0, 0)
    
    if (nextChangeHour >= 24) {
      nextChange.setDate(nextChange.getDate() + 1)
    }
    
    const diff = nextChange.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return { hours, minutes, nextTheme: isCurrentlyLight ? 'dark' : 'light' }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      return await Notification.requestPermission()
    }
    return Notification.permission
  }

  return {
    isAutoMode,
    enableAutoMode,
    disableAutoMode,
    updateConfig,
    config: finalConfig,
    currentHour,
    shouldBeLightTheme: shouldBeLightTheme(currentHour),
    getTimeUntilNextChange,
    requestNotificationPermission
  }
}