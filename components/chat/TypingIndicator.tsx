"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
  typingUsers: { userId: string; userName: string }[]
  className?: string
}

export function TypingIndicator({ typingUsers, className = "" }: TypingIndicatorProps) {
  const [dots, setDots] = useState("")

  // Animate the dots
  useEffect(() => {
    if (typingUsers.length === 0) return

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [typingUsers.length])

  if (typingUsers.length === 0) return null

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} écrit`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} et ${typingUsers[1].userName} écrivent`
    } else {
      return `${typingUsers[0].userName} et ${typingUsers.length - 1} autres écrivent`
    }
  }

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-tertiary px-4 py-2",
      "animate-in fade-in duration-200",
      className
    )}>
      <div className="flex gap-1">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
      <span>{getTypingText()}</span>
    </div>
  )
}

// CSS pour l'animation des points
const typingIndicatorStyles = `
  .typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--color-text-tertiary);
    animation: typing 1.4s infinite ease-in-out;
  }
  
  .typing-dot:nth-child(1) {
    animation-delay: -0.32s;
  }
  
  .typing-dot:nth-child(2) {
    animation-delay: -0.16s;
  }
  
  @keyframes typing {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`

// Add styles to document
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = typingIndicatorStyles
  document.head.appendChild(style)
}