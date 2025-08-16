"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
import { ConversationManager } from "@/components/conversation/conversation-manager"
import { AutoComplete } from "@/components/search/AutoComplete"
import { AdvancedFilters } from "@/components/search/AdvancedFilters"
import { MentionHighlighter } from "@/components/mention-highlighter"
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
  X
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
  createdAt?: string
  liked?: boolean
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

type SearchType = "posts" | "artists"
type SortBy = "date" | "popularity" | "likes" | "name"

export default function HomePage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [favoritedPosts, setFavoritedPosts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [searchType, setSearchType] = useState<SearchType>("posts")
  const [sortBy, setSortBy] = useState<SortBy>("popularity")
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [contactLoading, setContactLoading] = useState<{ artist: any; post: any } | null>(null)

  // Popular tags for quick selection
  const popularTags = [
    "tattoo", "piercing", "art", "design", "illustration", 
    "portrait", "realistic", "traditional", "japanese", "blackwork",
    "color", "minimalist", "geometric", "watercolor", "neo-traditional"
  ]

  useEffect(() => {
    // Debounce search to avoid micro jitters
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() || selectedTags.length > 0) {
        performSearch()
      } else {
        // Reset to default posts without loading state
        setIsSearching(false)
        fetchPosts()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedTags, searchType, sortBy])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/posts/recommended")
      const data = await response.json()
      if (response.ok) {
        setPosts(data.posts)
        setUsers([])
        setIsSearching(false)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching posts:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async () => {
    if (!searchQuery.trim() && selectedTags.length === 0) {
      fetchPosts()
      return
    }

    setIsSearching(true)
    setSearchLoading(true)
    
    try {
      if (searchType === "artists") {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}&tags=${encodeURIComponent(selectedTags.join(","))}&sortBy=${sortBy}`
        )
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users)
          setPosts([])
        }
      } else {
        const response = await fetch(
          `/api/posts/search?q=${encodeURIComponent(searchQuery)}&tags=${encodeURIComponent(selectedTags.join(","))}&sortBy=${sortBy}`
        )
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts)
          setUsers([])
        }
      }

      // Record search history
      if (session?.user?.id && (searchQuery.trim() || selectedTags.length > 0)) {
        await fetch("/api/search/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery.trim() || selectedTags.join(" "),
            hashtags: selectedTags,
          }),
        })
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Search error:", error)
      }
      toast.error("Failed to perform search")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
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
    setSearchLoading(false)
    // Fetch default posts immediately without loading state
    fetchPosts()
  }

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })
      
      if (response.ok) {
        setPosts(prev => {
          const currentPost = prev.find(p => p.id === postId)
          return prev.map(post => 
            post.id === postId 
              ? { 
                  ...post, 
                  liked: !post.liked,
                  likesCount: post.liked ? post.likesCount - 1 : post.likesCount + 1 
                }
              : post
          )
        })
        const currentPost = posts.find(p => p.id === postId)
        toast.success(currentPost?.liked ? "Post unliked!" : "Post liked!")
      }
    } catch (error) {
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

  const handleContactArtist = async (post: Post) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to contact artists")
      return
    }

    // Afficher l'écran de chargement factice
    setContactLoading({
      artist: post.author,
      post: {
        id: post.id,
        content: post.content,
        images: post.images
      }
    })

    try {
      const response = await fetch('/api/conversations/create-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: post.author.id,
          postId: post.id,
          subject: `Demande de renseignements - ${post.content.substring(0, 50)}...`,
          type: 'DIRECT'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Conversation créée !")
        // Rediriger vers la conversation
        window.location.href = `/conversations/${data.conversation.id}`
      } else {
        toast.error("Failed to create conversation")
        setContactLoading(null)
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
      toast.error("Failed to create conversation")
      setContactLoading(null)
    }
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
        <div className="mb-6">
          <AutoComplete
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSearch={handleSearch}
            placeholder="Search artists, posts, hashtags..."
            className="w-full"
          />
          
          {/* Search Type Toggle */}
          <div className="flex gap-2 mt-3">
            <Button
              variant={searchType === "posts" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchType("posts")}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
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
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters & Sort
            </Button>
            {(searchQuery.trim() || selectedTags.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSearch}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card mb-6">
            {/* Sort Options */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Sort by:</h3>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={sortBy === "popularity" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("popularity")}
                >
                  Trending
                </Button>
                <Button
                  variant={sortBy === "date" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("date")}
                >
                  Date
                </Button>
                {searchType === "posts" && (
                  <Button
                    variant={sortBy === "likes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("likes")}
                  >
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

        {/* Search Results Header */}
        {isSearching && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-foreground">
                {searchType === "artists" ? "Artists" : "Posts"} 
                {searchQuery.trim() && ` for "${searchQuery}"`}
                {selectedTags.length > 0 && ` with tags: ${selectedTags.map(t => `#${t}`).join(", ")}`}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSearch}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
            
            {/* Search Loading Indicator */}
            {searchLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <span>Searching...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {searchType === "artists" ? (
          // Artists Results
          <div className="space-y-4">
                        {users.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="card hover:bg-surface-elevated transition-colors cursor-pointer"
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
                      <p className="text-sm text-secondary">{user.businessName}</p>
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
              </Link>
            ))}
          </div>
        ) : (
          // Posts Grid
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="post-card group">
                {/* Post Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                    <Link href={`/profile/${post.author.username}`}>
                      <Avatar className="modern-avatar w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {post.author.username[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${post.author.username}`} className="hover:opacity-80 transition-opacity">
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
                        {new Date(post.publishedAt || post.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      </Link>
                    </div>
                  </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="p-4">
                  <p className="text-foreground mb-4">
                    <MentionHighlighter text={post.content} />
                  </p>
                  
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
                            <Link
                              key={collaboration.id}
                              href={`/profile/${collaboration.pro.username}`}
                              className="flex items-center gap-2 bg-muted rounded-full px-3 py-1 hover:bg-muted/80 transition-colors"
                            >
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
                            </Link>
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

                  {/* Action Buttons */}
                          <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleLike(post.id)}
              className={`h-8 w-8 ${post.liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
            >
              <Heart className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(post.id)}
              className={`h-8 w-8 ${favoritedPosts.has(post.id) ? 'text-yellow-500 hover:text-yellow-600' : 'text-muted-foreground hover:text-yellow-500'}`}
            >
              <Star className={`w-4 h-4 ${favoritedPosts.has(post.id) ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/posts/${post.id}`}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <MessageCircle className="w-4 h-4 mr-2" />
                View & Comment
              </Button>
            </Link>
            {post.author.id !== session?.user?.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleContactArtist(post)}
                className="text-primary hover:text-primary/80"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Contacter
              </Button>
            )}
          </div>
        </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && users.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {isSearching ? "No results found" : "No posts yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {isSearching 
                ? "Try different keywords or tags" 
                : "Be the first to share your artwork with the community!"
              }
            </p>
            {!isSearching && (
              session?.user?.role === "PRO" ? (
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
              )
            )}
          </div>
        )}
      </div>

      {/* Gestionnaire de conversation pour le contact */}
      {contactLoading && (
        <ConversationManager
          artist={contactLoading.artist}
          post={contactLoading.post}
          onClose={() => setContactLoading(null)}
        />
      )}

      <BottomNavigation />
    </div>
  )
}

