"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Send, MoreHorizontal, Phone, Video } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Message {
  id: string
  content: string
  sender: "user" | "other"
  timestamp: string
  type: "text" | "image" | "payment"
  paymentAmount?: number
}

export default function ConversationPage({ params }: { params: { id: string } }) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "J'aimerais bien faire une adaptation comme ça tu vois pour le tatouage des dragons que j'ai déjà fait",
      sender: "other",
      timestamp: "14:30",
      type: "text",
    },
    {
      id: "2",
      content: "Je te propose un projet que tu vas adorer, voici une idée que j'ai eu pour ton prochain tatouage",
      sender: "user",
      timestamp: "14:32",
      type: "text",
    },
    {
      id: "3",
      content: "Ça m'intéresse de ouf ça ! Faut juste que je regarde mes disponibilités des prochaines semaines",
      sender: "other",
      timestamp: "14:35",
      type: "text",
    },
    {
      id: "4",
      content:
        "Depuis que ton projet j'ai une idée spécial pour ton tatouage, je pense que ça va te plaire énormément et je pense que ça va être à la hauteur de tes attentes 😊",
      sender: "user",
      timestamp: "14:40",
      type: "text",
    },
    {
      id: "5",
      content: "Woah pour moi sérieux ! J'aimerais le femme quelques trucs mais sinon c'est parfait !",
      sender: "other",
      timestamp: "14:42",
      type: "text",
    },
    {
      id: "6",
      content: "J'aimerais bien une séance de 3h minimum",
      sender: "other",
      timestamp: "14:43",
      type: "text",
    },
    {
      id: "7",
      content: "/placeholder.svg?height=200&width=300",
      sender: "user",
      timestamp: "14:45",
      type: "image",
    },
    {
      id: "8",
      content: "700",
      sender: "user",
      timestamp: "14:46",
      type: "payment",
      paymentAmount: 700,
    },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        type: "text",
      }
      setMessages([...messages, newMessage])
      setMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="max-w-md mx-auto bg-black min-h-screen flex flex-col w-full">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Link href="/conversations">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white"
                // ACCESSIBILITY: Clear label for back button
                aria-label="Return to conversations list"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
              </Button>
            </Link>
            <Avatar className="w-10 h-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>@</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">@pierce</h2>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">12 Dec 2024</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">12 Dec 2024</span>
                {/* ACCESSIBILITY: Visual typing indicator for hearing-impaired users */}
                <span className="text-xs text-blue-400 flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse mr-1" aria-hidden="true"></span>
                  <span className="sr-only">@pierce is typing</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400"
              // ACCESSIBILITY: Clear label for phone call button
              aria-label="Start voice call with @pierce"
              title="Voice call"
            >
              <Phone className="w-5 h-5" aria-hidden="true" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400"
              // ACCESSIBILITY: Clear label for video call button
              aria-label="Start video call with @pierce"
              title="Video call"
            >
              <Video className="w-5 h-5" aria-hidden="true" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-400"
              // ACCESSIBILITY: Clear label for options menu
              aria-label="More conversation options"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <main 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          // ACCESSIBILITY: Proper main content region
          role="log"
          aria-label="Conversation messages"
          aria-live="polite"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${msg.sender === "user" ? "order-2" : "order-1"}`}>
                {msg.type === "text" && (
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      msg.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-white"
                    }`}
                    // ACCESSIBILITY: Message role for screen readers
                    role="article"
                    aria-label={`Message from ${msg.sender === "user" ? "you" : "@pierce"} at ${msg.timestamp}`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                )}

                {msg.type === "image" && (
                  <div 
                    className="rounded-2xl overflow-hidden"
                    // ACCESSIBILITY: Container for shared image
                    role="article"
                    aria-label={`Image shared by ${msg.sender === "user" ? "you" : "@pierce"} at ${msg.timestamp}`}
                  >
                    <Image
                      src={msg.content || "/placeholder.svg"}
                      alt={`Image shared by ${msg.sender === "user" ? "you" : "@pierce"} in conversation. Shared at ${msg.timestamp}.`}
                      width={300}
                      height={200}
                      className="object-cover"
                      // ACCESSIBILITY: Additional context for screen readers
                      title={`Shared image from ${msg.timestamp}`}
                    />
                    {/* ACCESSIBILITY: Hidden alternative text for complex images */}
                    <div className="sr-only">
                      Image content: This is a shared image in the conversation. 
                      If this image contains text, audio, or video content, please ask for a description.
                    </div>
                  </div>
                )}

                {msg.type === "payment" && (
                  <Card 
                    className="bg-gray-800 border-gray-700"
                    // ACCESSIBILITY: Payment request role and description
                    role="article"
                    aria-label={`Payment request for ${msg.paymentAmount} dollars from ${msg.sender === "user" ? "you" : "@pierce"}`}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-2" aria-label={`Amount: ${msg.paymentAmount} dollars`}>
                          {msg.paymentAmount} $
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            // ACCESSIBILITY: Clear action labels
                            aria-label={`Accept payment request for ${msg.paymentAmount} dollars`}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-600 bg-transparent"
                            // ACCESSIBILITY: Clear action labels
                            aria-label={`Decline payment request for ${msg.paymentAmount} dollars`}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className={`text-xs text-gray-400 mt-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                  <time dateTime={msg.timestamp} aria-label={`Message sent at ${msg.timestamp}`}>
                    {msg.timestamp}
                  </time>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </main>

        {/* Message Input */}
        <footer className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write here..."
              className="flex-1 bg-gray-800 border-gray-700 text-white rounded-full"
              // ACCESSIBILITY: Enhanced input accessibility
              aria-label="Type your message"
              aria-describedby="send-button-help"
            />
            <Button 
              onClick={sendMessage} 
              size="icon" 
              className="bg-blue-600 hover:bg-blue-700 rounded-full"
              // ACCESSIBILITY: Clear send button label
              aria-label="Send message"
              title="Send message (Enter)"
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </Button>
            {/* ACCESSIBILITY: Hidden help text */}
            <span id="send-button-help" className="sr-only">
              Press Enter or click Send to send your message
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
