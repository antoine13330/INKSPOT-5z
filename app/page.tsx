"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
import { 
  Heart, 
  MessageCircle, 
  Star, 
  Share2, 
  MoreHorizontal,
  Users,
  LogIn,
  Eye,
  DollarSign,
  CheckCircle,
  Search
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface Post {
  id: string
  content: string
  images: string[]
  hashtags: string[]
  price?: number
  isCollaboration: boolean
  likesCount: number
  commentsCount: number
  viewsCount: number
  publishedAt: string
  author: {
    id: string
    username: string
    businessName?: string
    avatar?: string
  }
  collaborations?: {
    id: string
    status: string
    pro: {
      id: string
      username: string
      businessName?: string
      avatar?: string
    }
  }[]
}

export default function HomePage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [favoritedPosts, setFavoritedPosts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts/recommended")
      const data = await response.json()
      if (response.ok) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })
      
      if (response.ok) {
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, likesCount: post.likesCount + 1 }
              : post
          )
        )
        toast.success("Post liked!")
      }
    } catch (error) {
      console.error("Error liking post:", error)
      toast.error("Failed to like post")
    }
  }

  const toggleFavorite = (postId: string) => {
    setFavoritedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
        toast.success("Removed from favorites")
      } else {
        newSet.add(postId)
        toast.success("Added to favorites")
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">INKSPOT</h1>
            <p className="text-muted-foreground text-sm">Discover amazing artwork</p>
          </div>
          {!session && (
            <Link href="/auth/login">
              <Button className="modern-button bg-primary hover:bg-primary/90 text-primary-foreground">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search artists, posts, hashtags..."
            className="modern-input w-full pl-10 pr-4 py-3"
          />
        </div>

        {/* Posts Grid */}
        <div className="posts-grid">
          {posts.map((post) => (
            <div key={post.id} className="post-card group">
              {/* Post Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="modern-avatar w-10 h-10">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {post.author.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground truncate">
                          {post.author.businessName || post.author.username}
                        </span>
                        {post.isCollaboration && (
                          <Badge variant="outline" className="modern-badge border-primary text-primary">
                            <Users className="w-3 h-3 mr-1" />
                            Collab
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4">
                <p className="text-foreground mb-4">{post.content}</p>
                
                {/* Collaborations */}
                {post.isCollaboration && post.collaborations && post.collaborations.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Collaborators:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.collaborations
                        .filter(collab => collab.status === "ACCEPTED")
                        .map((collaboration) => (
                          <div key={collaboration.id} className="flex items-center gap-2 bg-muted rounded-full px-3 py-1">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={collaboration.pro.avatar} />
                              <AvatarFallback className="bg-background text-xs">
                                {collaboration.pro.username[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-foreground">
                              {collaboration.pro.businessName || collaboration.pro.username}
                            </span>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Main Image */}
                {post.images.length > 0 && (
                  <div className="mb-4">
                    <div className="aspect-square overflow-hidden rounded-lg">
                      <Image 
                        src={post.images[0]} 
                        alt="Post image"
                        width={400}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                {post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.hashtags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="modern-badge bg-muted text-muted-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Price */}
                {post.price && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-foreground font-semibold">€{post.price}</span>
                    <Badge variant="outline" className="modern-badge border-green-500 text-green-500">
                      For Sale
                    </Badge>
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.commentsCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.viewsCount}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleLike(post.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(post.id)}
                      className={`h-8 w-8 ${favoritedPosts.has(post.id) ? 'text-yellow-500' : 'text-muted-foreground'} hover:text-yellow-500`}
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to share your artwork with the community!
            </p>
            {session?.user?.role === "PRO" ? (
              <Link href="/posts/create">
                <Button className="modern-button bg-primary hover:bg-primary/90 text-primary-foreground">
                  Create Your First Post
                </Button>
              </Link>
            ) : (
              <Link href="/auth/login">
                <Button className="modern-button bg-primary hover:bg-primary/90 text-primary-foreground">
                  Sign In to Create Posts
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  )
}
