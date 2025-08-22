"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Calendar, Search, Hash } from "lucide-react"
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
        <header className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">
              {isSearching ? "Search Results" : session?.user?.id ? "For You" : "Discover"}
            </h1>
            {session?.user?.role === "PRO" && (
              <Link href="/pro/dashboard">
                <Badge 
                  variant="secondary" 
                  className="bg-blue-600 text-white"
                  // ACCESSIBILITY: Clear label for pro dashboard
                  aria-label="Go to Pro Dashboard"
                >
                  Pro Dashboard
                </Badge>
              </Link>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" 
              aria-hidden="true" 
            />
            <Input
              placeholder="Search posts, hashtags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                searchPosts(e.target.value)
              }}
              className="bg-gray-800 border-gray-700 text-white pl-10 rounded-full"
              // ACCESSIBILITY: Enhanced search input
              aria-label="Search posts and hashtags"
              role="searchbox"
              aria-describedby="search-help"
            />
            {/* ACCESSIBILITY: Hidden help text */}
            <div id="search-help" className="sr-only">
              Type to search for posts or hashtags. Results will appear automatically as you type.
            </div>
          </div>
        </header>

        {/* Posts Feed */}
        <main 
          className="space-y-0 pb-20"
          // ACCESSIBILITY: Main content region
          role="main"
          aria-label="Social media feed"
        >
          {displayPosts.map((post) => (
            <Card
              key={post.id}
              className="bg-black border-gray-800 rounded-none border-x-0 border-t-0"
              onMouseEnter={() => recordPostView(post)}
              // ACCESSIBILITY: Post article role
              role="article"
              aria-label={`Post by ${post.author.username} from ${new Date(post.createdAt).toLocaleDateString()}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Link href={`/profile/${post.author.username}`}>
                      <Avatar 
                        className="w-10 h-10 cursor-pointer"
                        // ACCESSIBILITY: Profile avatar accessibility
                        role="img"
                        aria-label={`${post.author.username}'s profile picture`}
                      >
                        <AvatarImage 
                          src={post.author.avatar || "/placeholder.svg"} 
                          alt={`Profile picture of ${post.author.username}`}
                        />
                        <AvatarFallback>{post.author.username[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/profile/${post.author.username}`}>
                          <span 
                            className="font-semibold text-white hover:text-blue-400 cursor-pointer"
                            // ACCESSIBILITY: Clear link purpose
                            aria-label={`View ${post.author.username}'s profile`}
                          >
                            {post.author.username}
                          </span>
                        </Link>
                        {post.author.verified && (
                          <div 
                            className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                            // ACCESSIBILITY: Verification badge
                            role="img"
                            aria-label={`${post.author.username} is verified`}
                            title="Verified account"
                          >
                            <span className="text-white text-xs" aria-hidden="true">✓</span>
                          </div>
                        )}
                        {post.author.role === "PRO" && (
                          <Badge 
                            variant="outline" 
                            className="text-xs border-yellow-500 text-yellow-500"
                            // ACCESSIBILITY: Pro badge description
                            aria-label={`${post.author.username} is a professional service provider`}
                          >
                            PRO
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <time 
                          dateTime={post.createdAt}
                          aria-label={`Posted on ${new Date(post.createdAt).toLocaleDateString()}`}
                        >
                          {new Date(post.createdAt).toLocaleDateString()}
                        </time>
                        {post.author.role === "PRO" && post.author.specialties && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span>{post.author.specialties[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400"
                    // ACCESSIBILITY: Clear button purpose
                    aria-label={`More options for ${post.author.username}'s post`}
                  >
                    <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <p 
                  className="text-white mb-3 text-sm leading-relaxed"
                  // ACCESSIBILITY: Post content identification
                  aria-label={`Post content: ${post.content}`}
                >
                  {post.content}
                </p>

                {/* Hashtags */}
                {post.hashtags.length > 0 && (
                  <div 
                    className="flex flex-wrap gap-2 mb-3"
                    // ACCESSIBILITY: Hashtags section
                    role="list"
                    aria-label="Post hashtags"
                  >
                    {post.hashtags.map((hashtag, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(hashtag)
                          searchPosts(hashtag)
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                        // ACCESSIBILITY: Hashtag button accessibility
                        role="listitem"
                        aria-label={`Search for hashtag ${hashtag}`}
                      >
                        <Hash className="w-3 h-3 mr-1" aria-hidden="true" />
                        {hashtag.replace("#", "")}
                      </button>
                    ))}
                  </div>
                )}

                {/* Images */}
                {post.images.length > 0 && (
                  <div 
                    className="grid grid-cols-1 gap-2 rounded-lg overflow-hidden"
                    // ACCESSIBILITY: Images container
                    role="img"
                    aria-label={`${post.images.length} image${post.images.length > 1 ? 's' : ''} shared by ${post.author.username}`}
                  >
                    {post.images.map((image, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`Image ${index + 1} of ${post.images.length} shared by ${post.author.username} in their post. ${post.content ? 'Related to: ' + post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '') : ''}`}
                          width={400}
                          height={400}
                          className="w-full object-cover"
                          // ACCESSIBILITY: Additional context for images
                          title={`Image ${index + 1} by ${post.author.username}`}
                        />
                        {/* ACCESSIBILITY: Hidden description for multimedia content */}
                        <div className="sr-only">
                          Image {index + 1}: This image was shared by {post.author.username}. 
                          If this image contains text, captions, or represents video/audio content, 
                          please ask for a detailed description.
                        </div>
                      </div>
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
                      // ACCESSIBILITY: Like button with clear state indication
                      aria-label={`${post.liked ? 'Unlike' : 'Like'} ${post.author.username}'s post. Currently ${post.likesCount} likes.`}
                      aria-pressed={post.liked}
                    >
                      <Heart className={`w-5 h-5 mr-1 ${post.liked ? "fill-current" : ""}`} aria-hidden="true" />
                      <span className="text-sm" aria-label={`${post.likesCount} likes`}>{post.likesCount}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-blue-500 p-0"
                      // ACCESSIBILITY: Comment button
                      aria-label={`View ${post.commentsCount} comments on ${post.author.username}'s post`}
                    >
                      <MessageCircle className="w-5 h-5 mr-1" aria-hidden="true" />
                      <span className="text-sm" aria-label={`${post.commentsCount} comments`}>{post.commentsCount}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-green-500 p-0"
                      // ACCESSIBILITY: Share button
                      aria-label={`Share ${post.author.username}'s post`}
                    >
                      <Send className="w-5 h-5" aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="text-xs text-gray-400"
                      aria-label={`${post.viewsCount} people have viewed this post`}
                    >
                      {post.viewsCount} views
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-yellow-500 p-0"
                      // ACCESSIBILITY: Bookmark button
                      aria-label={`Bookmark ${post.author.username}'s post`}
                    >
                      <Bookmark className="w-5 h-5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                {session?.user?.id && (
                  <div className="mt-4 w-full space-y-2">
                    <div className="flex space-x-2">
                      <Link 
                        href={`/conversations/new?userId=${post.author.id}`} 
                        className="flex-1"
                        // ACCESSIBILITY: Clear link purpose
                        aria-label={`Start a conversation with ${post.author.username}`}
                      >
                        <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600">
                          <MessageCircle className="w-4 h-4 mr-2" aria-hidden="true" />
                          Contact {post.author.username}
                        </Button>
                      </Link>
                      {post.author.role === "PRO" && (
                        <Button
                          onClick={() => bookService(post.author.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          // ACCESSIBILITY: Clear booking action
                          aria-label={`Book a service with professional ${post.author.username}`}
                        >
                          <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
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
            <div 
              className="text-center py-12"
              // ACCESSIBILITY: Empty state message
              role="status"
              aria-label={isSearching ? "No posts found for your search" : "No posts available"}
            >
              <p className="text-gray-400">
                {isSearching ? "No posts found for your search." : "No posts available."}
              </p>
            </div>
          )}
        </main>

        <BottomNavigation />
      </div>
    </div>
  )
}
