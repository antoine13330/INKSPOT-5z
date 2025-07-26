"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Calendar, Search, Hash, LogIn } from "lucide-react"
import { BottomNavigation } from "@/components/bottom-navigation"
import { useSession } from "next-auth/react"
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

export default function HomePage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Post[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchRecommendedPosts()
    } else {
      fetchPublicPosts()
    }
  }, [session])

  const fetchRecommendedPosts = async () => {
    try {
      const response = await fetch("/api/posts/recommended")
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error("Error fetching recommended posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPublicPosts = async () => {
    try {
      const response = await fetch("/api/posts")
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchPosts = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/posts/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      setSearchResults(data.posts || [])

      // Record search history
      if (session?.user?.id) {
        await fetch("/api/search/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            hashtags: extractHashtags(query),
          }),
        })
      }
    } catch (error) {
      console.error("Error searching posts:", error)
    }
  }

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w]+/g
    return text.match(hashtagRegex) || []
  }

  const toggleLike = async (postId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })

      if (response.ok) {
        const newLiked = new Set(likedPosts)
        const isCurrentlyLiked = newLiked.has(postId)

        if (isCurrentlyLiked) {
          newLiked.delete(postId)
        } else {
          newLiked.add(postId)
        }
        setLikedPosts(newLiked)

        // Update posts state
        const updatePosts = (postsArray: Post[]) =>
          postsArray.map((post) =>
            post.id === postId
              ? { ...post, likesCount: post.likesCount + (isCurrentlyLiked ? -1 : 1), liked: !isCurrentlyLiked }
              : post,
          )

        setPosts(updatePosts)
        if (isSearching) {
          setSearchResults(updatePosts)
        }

        // Record interaction
        await fetch("/api/interactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetUserId: posts.find((p) => p.id === postId)?.author.id,
            interactionType: "like",
            weight: 2,
          }),
        })
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const recordPostView = async (post: Post) => {
    if (!session?.user?.id || post.author.id === session.user.id) return

    try {
      await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: post.author.id,
          interactionType: "view",
          weight: 1,
        }),
      })
    } catch (error) {
      console.error("Error recording view:", error)
    }
  }

  const bookService = (proId: string) => {
    window.location.href = `/booking/${proId}`
  }

  const displayPosts = isSearching ? searchResults : posts

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
        {/* Header with Search */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">
              {isSearching ? "Search Results" : session?.user?.id ? "For You" : "Discover"}
            </h1>
            {session?.user?.role === "PRO" && (
              <Link href="/pro/dashboard">
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  Pro Dashboard
                </Badge>
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search posts, hashtags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                searchPosts(e.target.value)
              }}
              className="bg-gray-800 border-gray-700 text-white pl-10 rounded-full"
            />
          </div>
        </div>

        {/* Login Prompt for Unauthenticated Users */}
        {!session?.user?.id && (
          <div className="p-4 border-b border-gray-800 bg-gray-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Join the community</h3>
                <p className="text-gray-400 text-sm">Sign in to like, comment, and connect with professionals</p>
              </div>
              <Link href="/auth/login">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-0 pb-20">
          {displayPosts.map((post) => (
            <Card
              key={post.id}
              className="bg-black border-gray-800 rounded-none border-x-0 border-t-0"
              onMouseEnter={() => recordPostView(post)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Link href={`/profile/${post.author.username}`}>
                      <Avatar className="w-10 h-10 cursor-pointer">
                        <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{post.author.username[1]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/profile/${post.author.username}`}>
                          <span className="font-semibold text-white hover:text-blue-400 cursor-pointer">
                            {post.author.username}
                          </span>
                        </Link>
                        {post.author.verified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        {post.author.role === "PRO" && (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
                            PRO
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.author.role === "PRO" && post.author.specialties && (
                          <>
                            <span>•</span>
                            <span>{post.author.specialties[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-gray-400">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <p className="text-white mb-3 text-sm leading-relaxed">{post.content}</p>

                {/* Hashtags */}
                {post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.hashtags.map((hashtag, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(hashtag)
                          searchPosts(hashtag)
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                      >
                        <Hash className="w-3 h-3 mr-1" />
                        {hashtag.replace("#", "")}
                      </button>
                    ))}
                  </div>
                )}

                {/* Images */}
                {post.images.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 rounded-lg overflow-hidden">
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

                {/* Pro Service Info */}
                {post.author.role === "PRO" && (
                  <div
                    className="mt-3 p-3 rounded-lg border border-gray-700"
                    style={{
                      backgroundColor: post.author.profileTheme?.backgroundColor || "#1f2937",
                      borderColor: post.author.profileTheme?.accentColor || "#374151",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">
                        {post.author.businessName || post.author.username}
                      </span>
                      {post.author.hourlyRate && (
                        <span className="text-sm text-green-400 font-medium">{post.author.hourlyRate}€/h</span>
                      )}
                    </div>
                    {post.author.specialties && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {post.author.specialties.slice(0, 3).map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-gray-800">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-gray-400 hover:text-red-500 p-0 ${post.liked ? "text-red-500" : ""}`}
                      onClick={() => toggleLike(post.id)}
                    >
                      <Heart className={`w-5 h-5 mr-1 ${post.liked ? "fill-current" : ""}`} />
                      <span className="text-sm">{post.likesCount}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-500 p-0">
                      <MessageCircle className="w-5 h-5 mr-1" />
                      <span className="text-sm">{post.commentsCount}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-green-500 p-0">
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">{post.viewsCount} views</span>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-yellow-500 p-0">
                      <Bookmark className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                {session?.user?.id && (
                  <div className="mt-4 w-full space-y-2">
                    <div className="flex space-x-2">
                      <Link href={`/conversations/new?userId=${post.author.id}`} className="flex-1">
                        <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Contact {post.author.username}
                        </Button>
                      </Link>
                      {post.author.role === "PRO" && (
                        <Button
                          onClick={() => bookService(post.author.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Book
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}

          {displayPosts.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-400">{isSearching ? "No posts found for your search." : "No posts available."}</p>
            </div>
          )}
        </div>

        <BottomNavigation />
      </div>
    </div>
  )
}
