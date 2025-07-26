"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Settings, Edit, MapPin, Calendar, LinkIcon, LogOut } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Post {
  id: string
  content: string
  images: string[]
  hashtags: string[]
  likesCount: number
  commentsCount: number
  viewsCount: number
  createdAt: string
  author: {
    id: string
    username: string
    avatar?: string
    role: string
    verified: boolean
    businessName?: string
    specialties?: string[]
    hourlyRate?: number
    profileTheme?: any
  }
  liked: boolean
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  })

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserPosts()
      fetchUserStats()
    }
  }, [session])

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/posts?userId=${session?.user?.id}`)
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error("Error fetching user posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/stats`)
      const data = await response.json()
      setUserStats(data)
    } catch (error) {
      console.error("Error fetching user stats:", error)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Please sign in to view your profile</h2>
          <Link href="/auth/login">
            <Button className="bg-blue-600 hover:bg-blue-700">Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Profile</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="text-gray-400">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={session.user.avatar || "/placeholder.svg"} />
              <AvatarFallback>{session.user.username?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-xl font-bold">@{session.user.username}</h2>
                {session.user.verified && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
                {session.user.role === "PRO" && (
                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
                    PRO
                  </Badge>
                )}
              </div>
              <p className="text-gray-400 mb-2">
                {session.user.role === "PRO" ? "Professional" : "Client"}
                {session.user.businessName && ` • ${session.user.businessName}`}
              </p>
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
              {session.user.bio || "No bio available"}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>{session.user.location || "Location not set"}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined recently</span>
              </div>
            </div>
            {session.user.website && (
              <div className="flex items-center space-x-1 mt-2 text-sm">
                <LinkIcon className="w-4 h-4 text-gray-400" />
                <a href={session.user.website} className="text-blue-400 hover:text-blue-300">
                  {session.user.website}
                </a>
              </div>
            )}
            {session.user.role === "PRO" && session.user.specialties && (
              <div className="flex flex-wrap gap-1 mt-2">
                {session.user.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-gray-800">
                    {specialty}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mb-6">
            <Link href="/profile/edit" className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Edit Profile
              </Button>
            </Link>
            {session.user.role === "PRO" && (
              <Link href="/pro/dashboard" className="flex-1">
                <Button variant="outline" className="w-full border-gray-600 text-white bg-transparent">
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Posts Section */}
        <div className="px-4">
          <h3 className="text-lg font-semibold mb-4">Your Posts</h3>
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id} className="bg-black border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{post.author.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white">{post.author.username}</span>
                          {post.author.verified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-white mb-3 text-sm">{post.content}</p>
                    {post.images.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 rounded-lg overflow-hidden mb-3">
                        {post.images.map((image, index) => (
                          <Image
                            key={index}
                            src={image || "/placeholder.svg"}
                            alt={`Post image ${index + 1}`}
                            width={400}
                            height={400}
                            className="w-full object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span>{post.likesCount} likes</span>
                        <span>{post.commentsCount} comments</span>
                        <span>{post.viewsCount} views</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No posts yet</p>
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Create Your First Post
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="h-20"></div>
        <BottomNavigation />
      </div>
    </div>
  )
}
