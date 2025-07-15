"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Search } from "lucide-react"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const users = [
    {
      id: "1",
      username: "@pierce",
      avatar: "/placeholder.svg?height=80&width=80",
      verified: true,
    },
    {
      id: "2",
      username: "@gourmet_del_arte",
      avatar: "/placeholder.svg?height=80&width=80",
      verified: false,
    },
    {
      id: "3",
      username: "@2623",
      avatar: "/placeholder.svg?height=80&width=80",
      verified: false,
    },
    {
      id: "4",
      username: "@gourmet",
      avatar: "/placeholder.svg?height=80&width=80",
      verified: false,
    },
    {
      id: "5",
      username: "@gourmet",
      avatar: "/placeholder.svg?height=80&width=80",
      verified: false,
    },
    {
      id: "6",
      username: "@SAMY",
      avatar: "/placeholder.svg?height=80&width=80",
      verified: false,
    },
    {
      id: "7",
      username: "@gourmet",
      avatar: "/placeholder.svg?height=80&width=80",
      verified: false,
    },
    {
      id: "8",
      username: "@gourmet",
      avatar: "/placeholder.svg?height=80&width=80",
      verified: false,
    },
  ]

  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()))

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

        {/* Users Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-gray-900 rounded-lg p-4 text-center hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{user.username[1]}</AvatarFallback>
                </Avatar>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-white font-medium text-sm">{user.username}</span>
                  {user.verified && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <BottomNavigation />
      </div>
    </div>
  )
}
