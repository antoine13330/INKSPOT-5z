"use client"

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { MessageBubble } from './message-bubble'
import { Message } from '@/types'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  readStatus?: Record<string, string[]>
  onMessageRead?: (messageId: string) => void
  className?: string
  'data-messages-container'?: boolean
}

export function MessageList(props: MessageListProps) {
  const {
    messages,
    currentUserId,
    readStatus = {},
    onMessageRead,
    className,
  } = props
  const dataMessagesContainer = (props as any)['data-messages-container'] as boolean | undefined
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isUserScrolling = useRef(false)
  const scrollTimeout = useRef<NodeJS.Timeout>()

  // Detect when user is manually scrolling
  const handleScroll = () => {
    if (!containerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50 // 50px tolerance
    
    // If user scrolled away from bottom, they're manually scrolling
    isUserScrolling.current = !isAtBottom
    
    // Reset scroll detection after 3 seconds of no scrolling
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }
    scrollTimeout.current = setTimeout(() => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50
        if (isAtBottom) {
          isUserScrolling.current = false
        }
      }
    }, 3000)
  }

  // Auto-scroll to bottom when new messages arrive (only if user isn't manually scrolling)
  useEffect(() => {
    if (!isUserScrolling.current && containerRef.current) {
      // Only auto-scroll if user is not manually scrolling
      setTimeout(() => {
        if (containerRef.current && !isUserScrolling.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      }, 100)
    }
  }, [messages])

  // Mark messages as read when they come into view
  useEffect(() => {
    if (!onMessageRead) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id')
            if (messageId) {
              onMessageRead(messageId)
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    const messageElements = document.querySelectorAll('[data-message-id]')
    messageElements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [messages, onMessageRead])

  if (messages.length === 0) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center p-8",
        className
      )}>
        <div className="text-center">
          <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">
            Aucun message
          </h3>
          <p className="text-secondary">
            Commencez la conversation en envoyant un message
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn(
        "message-list-container space-y-4",
        className
      )}
      data-messages-container={dataMessagesContainer ? true : undefined}
    >
      {messages.map((message) => (
        <div
          key={message.id}
          data-message-id={message.id}
          className={cn(
            "flex",
            message.senderId === currentUserId ? "justify-end" : "justify-start"
          )}
        >
          <MessageBubble
            message={message}
            isFromUser={message.senderId === currentUserId}
            showTimestamp={true}
          />
          
          {/* Read status indicator */}
          {message.senderId === currentUserId && readStatus[message.id] && (
            <div className="flex justify-end mt-1">
              <div className="flex items-center gap-1 text-xs text-tertiary">
                <span>✓</span>
                {readStatus[message.id].length > 0 && (
                  <span>{readStatus[message.id].length} lu</span>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  )
}