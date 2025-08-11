"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  Search,
  Filter,
  FileText,
  Calendar,
  TrendingUp,
  X
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { cn, debounce } from "@/lib/utils"

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
    verified: boolean
    role: string
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
  liked?: boolean
}

interface User {
  id: string
  username: string
  avatar?: string
  bio?: string
  location?: string
  verified: boolean
  role: string
  businessName?: string
  specialties: string[]
  hourlyRate?: number
  profileViews: number
  postsCount: number
  followersCount: number
  createdAt: string
}

type SearchType = "artists" | "posts"
type SortBy = "date" | "popularity" | "likes" | "name"

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [favoritedPosts, setFavoritedPosts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchType, setSearchType] = useState<SearchType>("posts")
  const [sortBy, setSortBy] = useState<SortBy>("popularity")
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<{ users: User[], posts: Post[] }>({ users: [], posts: [] })

  // Popular tags for quick selection
  const popularTags = [
    "tattoo", "piercing", "art", "design", "illustration", 
    "portrait", "realistic", "traditional", "japanese", "blackwork",
    "color", "minimalist", "geometric", "watercolor", "neo-traditional"
  ]

  useEffect(() => {
    if (!isSearching) {
      fetchPosts()
    }
  }, [isSearching])

  const fetchPosts = async () => {
    try {
      if (!session?.user?.id) {
        // If user is not authenticated, fetch public posts instead
        const response = await fetch("/api/posts/public")
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts)
        } else {
          // Fallback: create some sample posts for demo
          setPosts([
            {
              id: "demo-1",
              content: "🎨 Découvrez mon dernier projet artistique ! Une fusion de couleurs et d'émotions qui raconte une histoire unique.",
              images: [],
              hashtags: ["art", "créativité", "projet"],
              price: 150,
              isCollaboration: false,
              likesCount: 24,
              commentsCount: 8,
              viewsCount: 156,
              publishedAt: new Date().toISOString(),
              author: {
                id: "demo-user",
                username: "ArtisteCréatif",
                businessName: "Studio Créatif",
                avatar: "",
                verified: true,
                role: "artist"
              }
            },
            {
              id: "demo-2",
              content: "📸 Nouvelle collection photo disponible ! Capturé lors de mon voyage en Europe, chaque image raconte une histoire.",
              images: [],
              hashtags: ["photographie", "voyage", "europe"],
              price: 200,
              isCollaboration: true,
              likesCount: 18,
              commentsCount: 5,
              viewsCount: 89,
              publishedAt: new Date(Date.now() - 86400000).toISOString(),
              author: {
                id: "demo-user-2",
                username: "PhotoVoyageur",
                businessName: "Photo Studio",
                avatar: "",
                verified: false,
                role: "photographer"
              }
            }
          ])
        }
      } else {
        // User is authenticated, fetch recommended posts
        const response = await fetch("/api/posts/recommended")
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts)
        } else {
          console.error("Failed to fetch recommended posts")
        }
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      // Fallback posts on error
      setPosts([
        {
          id: "fallback-1",
          content: "🌟 Bienvenue sur INKSPOT ! Découvrez des artistes talentueux et des projets créatifs uniques.",
          images: [],
          hashtags: ["bienvenue", "art", "créativité"],
          price: undefined,
          isCollaboration: false,
          likesCount: 42,
          commentsCount: 12,
          viewsCount: 234,
          publishedAt: new Date().toISOString(),
          author: {
            id: "system",
            username: "INKSPOT",
            businessName: "INKSPOT Team",
            avatar: "",
            verified: true,
            role: "admin"
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, tags: string[], type: SearchType, sort: SortBy) => {
      if (!query.trim() && tags.length === 0) {
        setSearchResults({ users: [], posts: [] })
        setIsSearching(false)
        return
      }

      setIsSearching(true)
      try {
        if (type === "artists") {
          const response = await fetch(
            `/api/users/search?q=${encodeURIComponent(query)}&tags=${tags.join(",")}&sortBy=${sort}`
          )
          if (response.ok) {
            const data = await response.json()
            setSearchResults(prev => ({ ...prev, users: data.users }))
          }
        } else {
          const response = await fetch(
            `/api/posts/search?q=${encodeURIComponent(query)}&tags=${tags.join(",")}&sortBy=${sort}`
          )
          if (response.ok) {
            const data = await response.json()
            setSearchResults(prev => ({ ...prev, posts: data.posts }))
          }
        }

        // Record search history
        if (session?.user?.id && (query.trim() || tags.length > 0)) {
          await fetch("/api/search/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: query.trim() || tags.join(" "),
              hashtags: tags,
            }),
          })
        }
      } catch (error) {
        console.error("Search error:", error)
        toast.error("Failed to perform search")
      } finally {
        setIsSearching(false)
      }
    }, 300),
    [session?.user?.id]
  )

  // Effect to trigger search when parameters change
  useEffect(() => {
    if (searchQuery.trim() || selectedTags.length > 0) {
      debouncedSearch(searchQuery, selectedTags, searchType, sortBy)
    } else {
      setIsSearching(false)
      setSearchResults({ users: [], posts: [] })
    }
  }, [searchQuery, selectedTags, searchType, sortBy, debouncedSearch])

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })
      
      if (response.ok) {
        // Update posts in both main list and search results
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, likesCount: post.likesCount + 1 }
              : post
          )
        )
        setSearchResults(prev => ({
          ...prev,
          posts: prev.posts.map(post => 
            post.id === postId 
              ? { ...post, likesCount: post.likesCount + 1 }
              : post
          )
        }))
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

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSelectedTags([])
    setSearchType("posts")
    setSortBy("popularity")
    setIsSearching(false)
    setSearchResults({ users: [], posts: [] })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
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
            <p className="text-muted-foreground text-sm">
              {isSearching ? "Search Results" : "Discover amazing artwork"}
            </p>
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

        {/* Enhanced Search Bar */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search artists, posts, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "pl-10 pr-10 transition-all duration-200",
                isSearching && "ring-2 ring-primary ring-opacity-50"
              )}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Type Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={searchType === "posts" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchType("posts")}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              Posts
            </Button>
            <Button
              variant={searchType === "artists" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchType("artists")}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              Artists
            </Button>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters & Sort
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            {/* Sort Options */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Sort by:</h3>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={sortBy === "popularity" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("popularity")}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Popularity
                </Button>
                <Button
                  variant={sortBy === "date" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("date")}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Date
                </Button>
                {searchType === "posts" && (
                  <Button
                    variant={sortBy === "likes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("likes")}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    Likes
                  </Button>
                )}
                {searchType === "artists" && (
                  <Button
                    variant={sortBy === "name" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("name")}
                  >
                    Name
                  </Button>
                )}
              </div>
            </div>

            {/* Popular Tags */}
            <div>
              <h3 className="text-sm font-medium mb-2">Popular tags:</h3>
              <div className="flex gap-2 flex-wrap">
                {popularTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search Results or Posts */}
        {isSearching ? (
          // Search Results
          <div>
            {/* Search Status */}
            <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {searchType === "artists" ? "Searching Artists" : "Searching Posts"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="text-primary hover:text-primary/80"
                >
                  Clear Search
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {isSearching && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-3">Searching...</p>
              </div>
            )}

            {/* Results */}
            {!isSearching && (
              <div>
                {searchType === "artists" ? (
                  // Artists Results
                  <div className="space-y-4">
                    {searchResults.users.map((user) => (
                      <div
                        key={user.id}
                        className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {user.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-foreground">@{user.username}</span>
                              {user.verified && (
                                <Badge variant="default">✓</Badge>
                              )}
                            </div>
                            {user.businessName && (
                              <p className="text-sm text-muted-foreground">{user.businessName}</p>
                            )}
                            {user.bio && (
                              <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
                            )}
                            {user.specialties.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {user.specialties.slice(0, 3).map((specialty) => (
                                  <Badge key={specialty} variant="secondary">
                                    {specialty}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              <span>{user.postsCount} posts</span>
                              <span>{user.followersCount} followers</span>
                              <span>{user.profileViews} views</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Posts Results
                  <div className="space-y-4">
                    {searchResults.posts.map((post) => (
                      <div key={post.id} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-start space-x-3 mb-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={post.author.avatar} />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {post.author.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-foreground">@{post.author.username}</span>
                              {post.author.verified && (
                                <Badge variant="default">✓</Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(post.publishedAt)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-3 text-foreground">{post.content}</p>
                        
                        {post.hashtags.length > 0 && (
                          <div className="flex gap-1 mb-3 flex-wrap">
                            {post.hashtags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <button
                              onClick={() => handleLike(post.id)}
                              className={cn(
                                "flex items-center space-x-1 transition-colors",
                                post.liked ? "text-red-500" : "hover:text-red-400"
                              )}
                            >
                              <Heart className={cn("w-4 h-4", post.liked && "fill-current")} />
                              <span>{post.likesCount}</span>
                            </button>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{post.viewsCount}</span>
                            </div>
                            <span>{post.commentsCount} comments</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchResults.users.length === 0 && searchResults.posts.length === 0 && searchQuery.trim() && !isSearching && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try different keywords or tags
                    </p>
                    <Button
                      variant="outline"
                      onClick={clearSearch}
                      className="text-primary border-primary hover:bg-primary/10"
                    >
                      Clear Search
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Regular Posts Display
          <div>
            {/* Posts Header */}
            <div className="mb-4 p-3 bg-muted/30 border border-border rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Recommended Posts</span>
                <Badge variant="secondary" className="ml-auto">
                  {posts.length} posts
                </Badge>
              </div>
            </div>
            
            <div className="posts-grid">
              {posts.map((post) => (
                <div 
                  key={post.id} 
                  className="post-card group cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/posts/${post.id}`)}
                >
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
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  )
}
