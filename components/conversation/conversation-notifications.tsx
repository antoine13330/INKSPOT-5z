"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Bell, 
  MessageCircle, 
  Phone, 
  Video, 
  X, 
  CheckCircle,
  Clock,
  Star
} from "lucide-react"
import { toast } from "sonner"

interface Notification {
  id: string
  type: 'message' | 'call' | 'video' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    type: string
    label: string
    onClick: () => void
  }
}

interface ConversationNotificationsProps {
  artist: {
    id: string
    username: string
    businessName?: string
    avatar?: string
  }
  onClose: () => void
}

export function ConversationNotifications({ artist, onClose }: ConversationNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  // Notifications simulées
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: 'message',
        title: "Nouveau message",
        message: `${artist.businessName || artist.username} a répondu à votre message`,
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        read: false,
        action: {
          type: 'reply',
          label: 'Répondre',
          onClick: () => {
            toast.success("Ouverture de la conversation...")
            setShowNotifications(false)
          }
        }
      },
      {
        id: "2",
        type: 'system',
        title: "Conversation créée",
        message: "Votre conversation avec l'artiste a été créée avec succès",
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        read: true
      },
      {
        id: "3",
        type: 'call',
        title: "Appel manqué",
        message: `${artist.businessName || artist.username} a essayé de vous appeler`,
        timestamp: new Date(Date.now() - 900000), // 15 minutes ago
        read: false,
        action: {
          type: 'call',
          label: 'Rappeler',
          onClick: () => {
            toast.success("Initiating call...")
            setShowNotifications(false)
          }
        }
      }
    ]
    setNotifications(mockNotifications)
  }, [artist])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    toast.success("Toutes les notifications marquées comme lues")
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />
      case 'call':
        return <Phone className="w-4 h-4 text-green-500" />
      case 'video':
        return <Video className="w-4 h-4 text-purple-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'border-blue-200 bg-blue-50'
      case 'call':
        return 'border-green-200 bg-green-50'
      case 'video':
        return 'border-purple-200 bg-purple-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="relative">
      {/* Bouton de notifications */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
                    <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panneau de notifications */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Tout marquer comme lu
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                      notification.read ? 'opacity-75' : ''
                    } ${getNotificationColor(notification.type)}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-foreground">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {notification.timestamp.toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          
                          {notification.action && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                notification.action?.onClick()
                              }}
                              className="text-xs"
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border bg-muted/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{notifications.length} notification(s)</span>
              <span>{unreadCount} non lue(s)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
