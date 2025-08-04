"use client"

import { forwardRef, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageData } from "@/lib/websocket"
import { format } from "date-fns"
import { CheckCheck, Check, File, Image, CreditCard, Calendar } from "lucide-react"

interface MessageWithSender extends MessageData {
  sender: {
    id: string
    username: string | null
    name: string | null
    avatar: string | null
  }
  payment?: {
    id: string
    amount: number
    status: string
    description: string | null
  }
  booking?: {
    id: string
    title: string
    status: string
    scheduledDate: Date
  }
}

interface MessageListProps {
  messages: MessageWithSender[]
  currentUserId: string
  readStatus?: Record<string, string[]> // messageId -> userIds who read it
  onMessageRead?: (messageId: string) => void
  className?: string
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, currentUserId, readStatus = {}, onMessageRead, className = "" }, ref) => {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Mark messages as read when they come into view
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const messageId = entry.target.getAttribute("data-message-id")
              if (messageId && onMessageRead) {
                onMessageRead(messageId)
              }
            }
          })
        },
        { threshold: 0.5 }
      )

      const messageElements = document.querySelectorAll("[data-message-id]")
      messageElements.forEach((el) => observer.observe(el))

      return () => observer.disconnect()
    }, [messages, onMessageRead])

    const isMessageRead = (messageId: string) => {
      return readStatus[messageId]?.length > 0
    }

    const formatMessageTime = (timestamp: string) => {
      return format(new Date(timestamp), "HH:mm")
    }

    const renderMessageContent = (message: MessageWithSender) => {
      switch (message.messageType) {
        case "image":
          return (
            <div className="space-y-2">
              {message.attachments?.map((attachment, index) => (
                <img
                  key={index}
                  src={attachment}
                  alt="Shared image"
                  className="max-w-xs rounded-lg"
                />
              ))}
              {message.content && <p>{message.content}</p>}
            </div>
          )

        case "file":
          return (
            <div className="space-y-2">
              {message.attachments?.map((attachment, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <File className="w-4 h-4" />
                  <a 
                    href={attachment} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    {attachment.split('/').pop() || 'File'}
                  </a>
                </div>
              ))}
              {message.content && <p>{message.content}</p>}
            </div>
          )

        case "payment":
          return (
            <Card className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-6 h-6" />
                  <div>
                    <div className="text-xl font-bold">${message.payment?.amount}</div>
                    <div className="text-sm opacity-90">{message.payment?.description}</div>
                    <Badge variant="secondary" className="mt-1">
                      {message.payment?.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="secondary">
                    View Details
                  </Button>
                  {message.payment?.status === "pending" && (
                    <>
                      <Button size="sm" variant="secondary" className="bg-green-600 hover:bg-green-700">
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                        Decline
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )

        case "booking":
          return (
            <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6" />
                  <div>
                    <div className="font-semibold">{message.booking?.title}</div>
                    <div className="text-sm opacity-90">
                      {message.booking?.scheduledDate && 
                        format(new Date(message.booking.scheduledDate), "PPP 'at' p")
                      }
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {message.booking?.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="secondary">
                    View Booking
                  </Button>
                  {message.booking?.status === "pending" && (
                    <>
                      <Button size="sm" variant="secondary" className="bg-green-600 hover:bg-green-700">
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                        Reschedule
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )

        default:
          return <p className="whitespace-pre-wrap">{message.content}</p>
      }
    }

    return (
      <div ref={ref} className={`flex-1 overflow-y-auto space-y-4 p-4 ${className}`}>
        {messages.map((message) => {
          const isOwnMessage = message.senderId === currentUserId
          
          return (
            <div
              key={message.id}
              data-message-id={message.id}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex space-x-2 max-w-[80%] ${isOwnMessage ? "flex-row-reverse space-x-reverse" : ""}`}>
                {!isOwnMessage && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={message.sender.avatar || undefined} />
                    <AvatarFallback>
                      {(message.sender.username || message.sender.name || "?")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col space-y-1 ${isOwnMessage ? "items-end" : "items-start"}`}>
                  {!isOwnMessage && (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {message.sender.username || message.sender.name}
                    </span>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                    } ${message.messageType !== "text" ? "p-0 overflow-hidden" : ""}`}
                  >
                    {renderMessageContent(message)}
                  </div>
                  
                  <div className={`flex items-center space-x-1 text-xs text-gray-500 ${isOwnMessage ? "flex-row-reverse space-x-reverse" : ""}`}>
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {isOwnMessage && (
                      <div className="flex items-center">
                        {isMessageRead(message.id) ? (
                          <CheckCheck className="w-3 h-3 text-blue-600" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>
    )
  }
)

MessageList.displayName = "MessageList"