import React from 'react'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff } from 'lucide-react'

interface OnlineStatusIndicatorProps {
  isOnline: boolean
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function OnlineStatusIndicator({ 
  isOnline, 
  showText = true, 
  size = 'md',
  className 
}: OnlineStatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'rounded-full',
        isOnline ? 'bg-green-500' : 'bg-gray-400',
        sizeClasses[size]
      )} />
      
      {showText && (
        <span className={cn(
          'text-muted-foreground',
          textSizeClasses[size]
        )}>
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      )}
    </div>
  )
}

// Variante avec icône
export function OnlineStatusIndicatorWithIcon({ 
  isOnline, 
  showText = true, 
  size = 'md',
  className 
}: OnlineStatusIndicatorProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isOnline ? (
        <Wifi className={cn('text-green-500', sizeClasses[size])} />
      ) : (
        <WifiOff className={cn('text-gray-400', sizeClasses[size])} />
      )}
      
      {showText && (
        <span className={cn(
          'text-muted-foreground',
          textSizeClasses[size]
        )}>
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      )}
    </div>
  )
}
