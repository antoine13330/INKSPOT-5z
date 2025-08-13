"use client"

<<<<<<< HEAD
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
=======
>>>>>>> origin/cursor/nettoyer-les-composants-obsol-tes-a507
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
<<<<<<< HEAD
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
=======
import { usePosts } from "@/lib/hooks/use-posts"
import { useAuth } from "@/lib/hooks/use-auth"
>>>>>>> origin/cursor/nettoyer-les-composants-obsol-tes-a507
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
<<<<<<< HEAD
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
      // Log error for debugging (in production, send to monitoring service)
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching posts:", error)
      }
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
      // Log error for debugging (in production, send to monitoring service)
      if (process.env.NODE_ENV === 'development') {
        console.error("Error liking post:", error)
      }
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
=======
  const { user, isAuthenticated, isPro } = useAuth()
  const {
    posts,
    searchResults,
    searchQuery,
    isLoading,
    isSearching,
    searchPosts,
    toggleLike,
    recordView,
    clearSearch,
  } = usePosts()

  const handleSearchChange = (query: string) => {
    if (!query.trim()) {
      clearSearch()
    } else {
      searchPosts(query)
    }
  }



  const bookService = (proId: string) => {
    window.location.href = `/booking/${proId}`
  }

  const displayPosts = isSearching ? searchResults : posts

  if (isLoading) {
>>>>>>> origin/cursor/nettoyer-les-composants-obsol-tes-a507
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
<<<<<<< HEAD
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
=======
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Header with Search */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold">
                              {isSearching ? "Search Results" : isAuthenticated ? "For You" : "Discover"}
            </h1>
            {isPro && (
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white pl-10 rounded-full"
            />
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-0 pb-20">
          {displayPosts.map((post) => (
            <Card
              key={post.id}
              className="bg-black border-gray-800 rounded-none border-x-0 border-t-0"
              onMouseEnter={() => recordView(post.id)}
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
>>>>>>> origin/cursor/nettoyer-les-composants-obsol-tes-a507
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
