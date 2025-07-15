"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Search, Check } from "lucide-react"
import Link from "next/link"

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
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white pl-10 rounded-full"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab("conversations")}
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "conversations" ? "text-white border-b-2 border-blue-500" : "text-gray-400"
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setActiveTab("archives")}
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === "archives" ? "text-white border-b-2 border-blue-500" : "text-gray-400"
            }`}
          >
            Archives
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1">
          {filteredConversations.map((conversation) => (
            <Link key={conversation.id} href={`/conversations/${conversation.id}`} className="block">
              <div className="flex items-center p-4 hover:bg-gray-900 border-b border-gray-800/50">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{conversation.user.name[0]}</AvatarFallback>
                  </Avatar>
                  {conversation.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
                  )}
                </div>

                <div className="flex-1 ml-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white truncate">{conversation.user.name}</h3>
                    <span className="text-xs text-gray-400">{conversation.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p
                      className={`text-sm truncate ${
                        conversation.user.status === "typing" ? "text-blue-400" : "text-gray-400"
                      }`}
                    >
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                    <div className="flex items-center space-x-2">
                      {conversation.unread && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                      <Check className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <BottomNavigation />
      </div>
    </div>
  )
}
