"use client"

import React from 'react'
import { useSession } from 'next-auth/react'
import { useOnlineStatus } from '@/lib/providers/online-status-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

export function OnlineStatusDebug() {
  const { data: session, status } = useSession()
  const { 
    onlineUsers, 
    isLoading, 
    currentUserOnline, 
    refreshOnlineUsers, 
    setUserOnline 
  } = useOnlineStatus()

  if (status === 'loading') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debug Statut En Ligne</CardTitle>
          <CardDescription>Chargement de la session...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debug Statut En Ligne</CardTitle>
          <CardDescription>Vous devez être connecté pour voir le statut</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Debug Statut En Ligne
          {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
        </CardTitle>
        <CardDescription>
          Session: {session?.user?.username || session?.user?.email}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statut actuel */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {currentUserOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <span>Mon statut:</span>
            <Badge variant={currentUserOnline ? "secondary" : "destructive"}>
              {currentUserOnline ? 'En ligne' : 'Hors ligne'}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setUserOnline(true)}
              disabled={isLoading}
            >
              Marquer En ligne
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setUserOnline(false)}
              disabled={isLoading}
            >
              Marquer Hors ligne
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshOnlineUsers}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Liste des utilisateurs en ligne */}
        <div>
          <h3 className="font-semibold mb-2">
            Utilisateurs en ligne ({onlineUsers.length})
          </h3>
          
          {onlineUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucun utilisateur en ligne
            </p>
          ) : (
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-2 bg-background border rounded"
                >
                  <div>
                    <span className="font-medium">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.username
                      }
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (@{user.username})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTime(user.lastActiveAt)}
                    </span>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informations de debug */}
        <details className="border rounded p-2">
          <summary className="cursor-pointer text-sm font-medium">
            Debug Info
          </summary>
          <div className="mt-2 text-xs space-y-1">
            <div>Session Status: {status}</div>
            <div>User ID: {session?.user?.id}</div>
            <div>Loading: {isLoading.toString()}</div>
            <div>Current User Online: {currentUserOnline.toString()}</div>
            <div>Online Users Count: {onlineUsers.length}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  
  if (diffMinutes < 1) return "maintenant"
  if (diffMinutes < 60) return `il y a ${diffMinutes}m`
  
  const diffHours = Math.floor(diffMinutes / 60)
  return `il y a ${diffHours}h`
}
