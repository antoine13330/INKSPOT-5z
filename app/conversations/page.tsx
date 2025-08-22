"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Search, Check } from "lucide-react"
import Link from "next/link"
// ACCESSIBILITY: Import visual indicators
import { SoundIndicator } from "@/components/accessibility/MediaAccessibility"

export default function ConversationsPage() {
  const [activeTab, setActiveTab] = useState<"conversations" | "archives">("conversations")
  const [searchQuery, setSearchQuery] = useState("")

  const conversations = [
    {
      id: "1",
      user: {
        name: "Despoteur Fou",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "typing",
      },
      lastMessage: "Is typing...",
      timestamp: "12:34",
      unread: false,
      online: true,
    },
    {
      id: "2",
      user: {
        name: "The Homelander",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "online",
      },
      lastMessage: "Are you open for a new tattoo project ? I have some...",
      timestamp: "12:30",
      unread: true,
      online: true,
    },
    {
      id: "3",
      user: {
        name: "GorillouZ",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "offline",
      },
      lastMessage: "Are you open for a new tattoo project ? I have some...",
      timestamp: "12:10",
      unread: false,
      online: false,
    },
    {
      id: "4",
      user: {
        name: "DoomSlayer",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "offline",
      },
      lastMessage: "",
      timestamp: "12:09",
      unread: false,
      online: false,
    },
    {
      id: "5",
      user: {
        name: "Sam sulek",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "offline",
      },
      lastMessage: "Are you open for a new tattoo project ? I have some...",
      timestamp: "11:01",
      unread: false,
      online: false,
    },
    {
      id: "6",
      user: {
        name: "BigDackDock",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "offline",
      },
      lastMessage: "Are you open for a new tattoo project ? I have some...",
      timestamp: "8:59",
      unread: false,
      online: false,
    },
    {
      id: "7",
      user: {
        name: "Gaufre Salée",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "offline",
      },
      lastMessage: "Are you open for a new tattoo project ? I have some...",
      timestamp: "8:34",
      unread: false,
      online: false,
    },
    {
      id: "8",
      user: {
        name: "Pajpal Roulant",
        avatar: "/placeholder.svg?height=40&width=40",
        status: "offline",
      },
      lastMessage: "Are you open for a new tattoo project ? I have some...",
      timestamp: "7:40",
      unread: false,
      online: false,
    },
  ]

  const filteredConversations = conversations.filter((conv) =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Search Bar */}
        <header className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" 
              aria-hidden="true"
            />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white pl-10 rounded-full"
              // ACCESSIBILITY: Enhanced search functionality
              aria-label="Search conversations"
              role="searchbox"
              aria-describedby="conversation-search-help"
            />
            {/* ACCESSIBILITY: Hidden help text */}
            <div id="conversation-search-help" className="sr-only">
              Search through your conversations by contact name
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div 
          className="flex border-b border-gray-800"
          // ACCESSIBILITY: Tab navigation
          role="tablist"
          aria-label="Conversation views"
        >
          <button
            onClick={() => setActiveTab("conversations")}
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "conversations" ? "text-white border-b-2 border-blue-500" : "text-gray-400"
            }`}
            // ACCESSIBILITY: Tab controls
            role="tab"
            aria-selected={activeTab === "conversations"}
            aria-controls="conversations-panel"
            id="conversations-tab"
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab("archives")}
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "archives" ? "text-white border-b-2 border-blue-500" : "text-gray-400"
            }`}
            // ACCESSIBILITY: Tab controls
            role="tab"
            aria-selected={activeTab === "archives"}
            aria-controls="archives-panel"
            id="archives-tab"
          >
            Archives
          </button>
        </div>

        {/* Conversations List */}
        <main 
          className="flex-1"
          // ACCESSIBILITY: Tab panel
          role="tabpanel"
          id="conversations-panel"
          aria-labelledby="conversations-tab"
        >
          {filteredConversations.map((conversation) => (
            <Link 
              key={conversation.id} 
              href={`/conversations/${conversation.id}`} 
              className="block"
              // ACCESSIBILITY: Clear conversation link purpose
              aria-label={`Open conversation with ${conversation.user.name}. ${conversation.unread ? 'Has unread messages. ' : ''}${conversation.user.status === 'typing' ? 'Currently typing. ' : ''}Last message: ${conversation.lastMessage || 'No recent messages'}`}
            >
              <div className="flex items-center p-4 hover:bg-gray-900 border-b border-gray-800/50">
                <div className="relative">
                  <Avatar 
                    className="w-12 h-12"
                    // ACCESSIBILITY: Avatar accessibility
                    role="img"
                    aria-label={`${conversation.user.name}'s profile picture`}
                  >
                    <AvatarImage 
                      src={conversation.user.avatar || "/placeholder.svg"} 
                      alt={`Profile picture of ${conversation.user.name}`}
                    />
                    <AvatarFallback>{conversation.user.name[0]}</AvatarFallback>
                  </Avatar>
                  {/* ACCESSIBILITY: Enhanced online status indicator */}
                  {conversation.online && (
                    <div 
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"
                      // ACCESSIBILITY: Online status for screen readers
                      role="img"
                      aria-label={`${conversation.user.name} is online`}
                      title="Online"
                    ></div>
                  )}
                </div>

                <div className="flex-1 ml-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white truncate">{conversation.user.name}</h3>
                    <time 
                      className="text-xs text-gray-400"
                      dateTime={conversation.timestamp}
                      aria-label={`Last message at ${conversation.timestamp}`}
                    >
                      {conversation.timestamp}
                    </time>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          conversation.user.status === "typing" ? "text-blue-400" : "text-gray-400"
                        }`}
                      >
                        {/* ACCESSIBILITY: Visual typing indicator */}
                        {conversation.user.status === "typing" && (
                          <span className="inline-flex items-center mr-2">
                            <span className="accessibility-typing-indicator w-2 h-2 bg-blue-400 rounded-full mr-1" aria-hidden="true"></span>
                            <SoundIndicator 
                              soundType="message" 
                              description="User is typing a message"
                              className="mr-1"
                            />
                          </span>
                        )}
                        <span aria-label={
                          conversation.user.status === "typing" 
                            ? `${conversation.user.name} is currently typing a message`
                            : `Last message: ${conversation.lastMessage || "No messages yet"}`
                        }>
                          {conversation.lastMessage || "No messages yet"}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* ACCESSIBILITY: Enhanced unread indicator */}
                      {conversation.unread && (
                        <div 
                          className="w-2 h-2 bg-red-500 rounded-full"
                          // ACCESSIBILITY: Unread indicator for screen readers
                          role="img"
                          aria-label="Unread messages"
                          title="You have unread messages"
                        ></div>
                      )}
                      <Check 
                        className="w-4 h-4 text-gray-400" 
                        aria-hidden="true"
                        // ACCESSIBILITY: Read receipt context
                        title="Message delivered"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* ACCESSIBILITY: Empty state with proper messaging */}
          {filteredConversations.length === 0 && (
            <div 
              className="text-center py-12"
              role="status"
              aria-label={searchQuery ? "No conversations found matching your search" : "No conversations available"}
            >
              <p className="text-gray-400">
                {searchQuery ? "No conversations found matching your search." : "No conversations yet."}
              </p>
            </div>
          )}
        </main>

        <BottomNavigation />
      </div>
    </div>
  )
}
