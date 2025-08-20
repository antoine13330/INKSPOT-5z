"use client"

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOnlineStatus } from '@/lib/providers/online-status-provider'
import { Wifi, WifiOff } from 'lucide-react'

interface OnlineUsersListProps {
  className?: string
  compact?: boolean
}

export function OnlineUsersList({ className = '', compact = false }: OnlineUsersListProps) {
  const { onlineUsers, isLoading, currentUserOnline, refreshOnlineUsers } = useOnlineStatus()

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Utilisateurs en ligne</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Chargement...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {currentUserOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm text-muted-foreground">
            {onlineUsers.length} en ligne
          </span>
        </div>
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 3).map((user) => (
            <Avatar key={user.id} className="w-6 h-6 border-2 border-background">
              {user.avatar ? (
                <AvatarImage src={user.avatar} />
              ) : (
                <AvatarFallback className="text-xs">
                  {(user.firstName?.[0] || '') + (user.lastName?.[0] || user.username[0] || '?')}
                </AvatarFallback>
              )}
            </Avatar>
          ))}
          {onlineUsers.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span className="text-xs text-muted-foreground">+{onlineUsers.length - 3}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Utilisateurs en ligne</CardTitle>
            <CardDescription>
              {onlineUsers.length} utilisateur{onlineUsers.length > 1 ? 's' : ''} connecté{onlineUsers.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {currentUserOnline ? (
              <Badge variant="secondary" className="text-green-600 bg-green-50">
                <Wifi className="w-3 h-3 mr-1" />
                En ligne
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-red-600 bg-red-50">
                <WifiOff className="w-3 h-3 mr-1" />
                Hors ligne
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {onlineUsers.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            Aucun utilisateur en ligne
          </div>
        ) : (
          onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} />
                  ) : (
                    <AvatarFallback className="text-sm">
                      {(user.firstName?.[0] || '') + (user.lastName?.[0] || user.username[0] || '?')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.username
                    }
                  </p>
                  {user.username !== (user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.username
                  ) && (
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Actif {formatLastActiveTime(user.lastActiveAt)}
                </p>
              </div>
            </div>
          ))
        )}
        
        <div className="pt-2 border-t">
          <button 
            onClick={refreshOnlineUsers}
            className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
          >
            Actualiser
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function formatLastActiveTime(lastActiveAt: string): string {
  const now = new Date()
  const lastActive = new Date(lastActiveAt)
  const diffMs = now.getTime() - lastActive.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) {
    return "à l'instant"
  } else if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`
  } else {
    const diffHours = Math.floor(diffMinutes / 60)
    return `il y a ${diffHours}h`
  }
}
