"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Bell, 
  Search, 
  Filter, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock, 
  Star,
  X,
  XCircle,
  Users,
  MessageCircle,
  Calendar,
  CreditCard,
  AlertTriangle,
  Zap,
  Check,
  RefreshCw,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  priority: 'low' | 'normal' | 'high'
  category: string
  data?: any
  createdAt: string
  quickActions?: Array<{
    action: string
    label: string
    icon?: string
  }>
}

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [showRead, setShowRead] = useState(true)
  const [sortBy, setSortBy] = useState<"date" | "priority" | "type">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  useEffect(() => {
    filterAndSortNotifications()
  }, [notifications, searchQuery, activeTab, filterPriority, filterCategory, showRead, sortBy, sortOrder])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/notifications")
      const data = await response.json()
      
      if (data.notifications) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      // Silently handle error - could be logged to a service in production
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortNotifications = useCallback(() => {
    let filtered = [...notifications]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply tab filter
    if (activeTab !== "all") {
      filtered = filtered.filter(notification => notification.type === activeTab.toUpperCase())
    }

    // Apply priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter(notification => notification.priority === filterPriority)
    }

    // Apply category filter
    if (filterCategory !== "all") {
      filtered = filtered.filter(notification => notification.category === filterCategory)
    }

    // Apply read filter
    if (!showRead) {
      filtered = filtered.filter(notification => !notification.read)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "priority":
          const priorityOrder = { high: 3, normal: 2, low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case "type":
          comparison = a.type.localeCompare(b.type)
          break
      }
      
      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredNotifications(filtered)
  }, [notifications, searchQuery, activeTab, filterPriority, filterCategory, showRead, sortBy, sortOrder])

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationIds, read: true }),
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notificationIds.includes(notification.id)
              ? { ...notification, read: true }
              : notification
          )
        )
        toast.success("Notifications marked as read")
      }
    } catch (error) {
      // Error marking notifications as read (removed console.error for production)
      toast.error("Failed to mark notifications as read")
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        toast.success("Notification deleted")
      }
    } catch (error) {
      // Error deleting notification (removed console.error for production)
      toast.error("Failed to delete notification")
    }
  }

  const handleQuickAction = async (notification: Notification, action: string) => {
    try {
      switch (action) {
        case "confirm":
          // Handle confirmation action
          toast.success("Action confirmed")
          break
        case "reschedule":
          // Handle reschedule action
          toast.success("Redirecting to reschedule...")
          break
        case "cancel":
          // Handle cancellation action
          toast.success("Action cancelled")
          break
        case "pay_now":
          // Handle payment action
          toast.success("Redirecting to payment...")
          break
        case "review":
          // Handle review action
          toast.success("Redirecting to review...")
          break
        default:
          // Unknown action (removed console.log for production)
      }

      // Mark as read after action
      await markAsRead([notification.id])
    } catch (error) {
      // Error handling quick action (removed console.error for production)
      toast.error("Failed to process action")
    }
  }

  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = { className: "w-4 h-4" }
    
    switch (type) {
      case "COLLABORATION_INVITE":
      case "COLLABORATION_ACCEPTED":
      case "COLLABORATION_REJECTED":
        return <Users {...iconProps} />
      case "MESSAGE":
        return <MessageCircle {...iconProps} />
      case "BOOKING":
      case "APPOINTMENT":
        return <Calendar {...iconProps} />
      case "PAYMENT":
        return <CreditCard {...iconProps} />
      case "REMINDER":
        return <Clock {...iconProps} />
      case "SYSTEM":
        return priority === 'high' ? <AlertTriangle {...iconProps} /> : <Info {...iconProps} />
      default:
        return <Bell {...iconProps} />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return "bg-red-500"
    
    switch (type) {
      case "COLLABORATION_ACCEPTED":
        return "bg-green-500"
      case "COLLABORATION_REJECTED":
        return "bg-red-500"
      case "PAYMENT":
        return "bg-blue-500"
      case "BOOKING":
        return "bg-purple-500"
      case "SYSTEM":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: { color: "bg-red-100 text-red-800 border-red-200", icon: Zap },
      normal: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Info },
      low: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: CheckCircle }
    }
    
    const variant = variants[priority as keyof typeof variants] || variants.normal
    const Icon = variant.icon
    
    return (
      <Badge variant="outline" className={`${variant.color} text-xs`}>
        <Icon className="w-3 h-3 mr-1" />
        {priority}
      </Badge>
    )
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead([notification.id])
    }

    // Handle navigation based on notification type and data
    if (notification.data?.actionUrl) {
      window.location.href = notification.data.actionUrl
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  const getUnreadCount = () => notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Notifications</h2>
            {getUnreadCount() > 0 && (
              <Badge variant="destructive" className="ml-2">
                {getUnreadCount()}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={getUnreadCount() === 0}
            >
              <Check className="w-4 h-4 mr-1" />
              Mark All Read
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="appointment">Appointment</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-read"
                checked={showRead}
                onCheckedChange={setShowRead}
              />
              <label htmlFor="show-read" className="text-sm text-gray-600 dark:text-gray-400">
                Show Read
              </label>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="booking">Bookings</TabsTrigger>
            <TabsTrigger value="payment">Payments</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="max-h-96">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification, index) => (
                    <Card 
                      key={notification.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        notification.read ? 'opacity-75' : 'ring-2 ring-blue-200'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}>
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'} dark:text-gray-100`}>
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {notification.message}
                                </p>
                                
                                {/* Quick Actions */}
                                {notification.quickActions && notification.quickActions.length > 0 && (
                                  <div className="flex items-center space-x-2 mt-3">
                                    {notification.quickActions.map((action) => (
                                      <Button
                                        key={action.action}
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleQuickAction(notification, action.action)
                                        }}
                                        className="text-xs h-7"
                                      >
                                        {action.label}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                  </span>
                                  {getPriorityBadge(notification.priority)}
                                  {notification.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {notification.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1 ml-2">
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>{filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}</span>
            <Button variant="ghost" size="sm" onClick={fetchNotifications}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}