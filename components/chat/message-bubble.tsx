import React from 'react'
import { cn, formatTime } from '@/lib/utils'
import { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isFromUser: boolean
  showTimestamp?: boolean
  className?: string
}

export function MessageBubble({
  message,
  isFromUser,
  showTimestamp = true,
  className
}: MessageBubbleProps) {
  const isImage = message.type === 'IMAGE' && message.mediaUrl

  return (
    <div className={cn(
      'message',
      isFromUser ? 'user' : 'other',
      className
    )}>
      <div className="message-bubble">
        {isImage && (
          <div className="mb-2">
            <img 
              src={message.mediaUrl} 
              alt="Image" 
              className="rounded-lg max-w-full max-h-64 object-cover"
            />
          </div>
        )}
        
        <div className="message-content">
          {message.content}
        </div>
        
        {showTimestamp && (
          <div className="text-xs text-tertiary mt-1 opacity-70">
            {formatTime(message.createdAt)}
          </div>
        )}
      </div>
    </div>
  )
} 