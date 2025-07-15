"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Settings, Edit, MapPin, Calendar, LinkIcon } from "lucide-react"

export default function ProfilePage() {
  const [isFollowing, setIsFollowing] = useState(false)

  const userStats = {
    posts: 127,
    followers: 1234,
    following: 567,
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Profile</h1>
          <Button variant="ghost" size="icon" className="text-gray-400">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="/placeholder.svg?height=80&width=80" />
              <AvatarFallback>@P</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-xl font-bold">@pierce</h2>
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>
              <p className="text-gray-400 mb-2">Tattoo Artist</p>
              <div className="flex space-x-4 text-sm">
                <span>
                  <strong>{userStats.posts}</strong> Posts
                </span>
                <span>
                  <strong>{userStats.followers}</strong> Followers
                </span>
                <span>
                  <strong>{userStats.following}</strong> Following
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <p className="text-white mb-2">
              Professional tattoo artist specializing in custom designs and traditional art.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>Paris, France</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined Dec 2020</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 mt-2 text-sm">
              <LinkIcon className="w-4 h-4 text-gray-400" />
              <a href="#" className="text-blue-400 hover:text-blue-300">
                pierce-tattoo.com
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mb-6">
            <Button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`flex-1 ${
                isFollowing ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button variant="outline" className="flex-1 border-gray-600 text-white bg-transparent">
              Message
            </Button>
            <Button variant="outline" size="icon" className="border-gray-600 text-white bg-transparent">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="px-4">
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-800 rounded">
                <img
                  src={`/placeholder.svg?height=120&width=120&text=Post${i + 1}`}
                  alt={`Post ${i + 1}`}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="h-20"></div>
        <BottomNavigation />
      </div>
    </div>
  )
}
