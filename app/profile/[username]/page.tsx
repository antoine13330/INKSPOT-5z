"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
import { 
  ArrowLeft,
  MessageCircle,
  Heart,
  Eye,
  Users,
  MapPin,
  Globe,
  Phone,
  Calendar,
  Star,
  Edit,
  Settings,
  Briefcase,
  Palette
} from "lucide-react"
import { toast } from "sonner"
// Removed next/image import - not used

interface UserProfile {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  avatar?: string
  coverImage?: string
  verified: boolean
  role: string
  businessName?: string
  specialties: string[]
  hourlyRate?: number
  profileViews: number
  postsCount: number
  followersCount: number
  followingCount: number
  createdAt: string
  profileTheme?: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    backgroundColor: string
    textColor: string
    fontFamily: string
  }
}

interface Post {
  id: string
  content: string
  images: string[]
  hashtags: string[]
  likesCount: number
  commentsCount: number
  viewsCount: number
  publishedAt: string
  createdAt?: string
  liked: boolean
}

export default function UserProfilePage() {
  const params = useParams()
  const { data: session } = useSession()
  const username = params?.username as string
  
  // Early return if no username
  if (!username) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invalid username</h1>
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [favorites, setFavorites] = useState<Post[]>([])
  const [likedPosts, setLikedPosts] = useState<Post[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"posts" | "favorites" | "liked" | "about" | "portfolio">("posts")
  
  // Search states for each tab
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (username && params?.username) {
      fetchUserProfile()
      fetchUserPosts() // posts du profil
      checkFollowStatus()
    }
  }, [username, params?.username])

  useEffect(() => {
    if (activeTab === "favorites") {
      fetchUserFavorites()
    } else if (activeTab === "liked") {
      fetchUserLikedPosts()
    }
  }, [activeTab])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${username}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
      } else {
        toast.error("User not found")
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      toast.error("Failed to load profile")
    }
  }

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/users/${username}/posts`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      console.error("Error fetching user posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserFavorites = async () => {
    try {
      const response = await fetch(`/api/users/${username}/favorites`)
      if (response.ok) {
        const data = await response.json()
        setFavorites(data.posts)
      }
    } catch (error) {
      console.error("Error fetching user favorites:", error)
    }
  }

  const fetchUserLikedPosts = async () => {
    try {
      const response = await fetch(`/api/users/${username}/liked-posts`)
      if (response.ok) {
        const data = await response.json()
        setLikedPosts(data.posts)
      }
    } catch (error) {
      console.error("Error fetching user liked posts:", error)
    }
  }

  const checkFollowStatus = async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch(`/api/users/${username}/follow-status`)
      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data.isFollowing)
      }
    } catch (error) {
      console.error("Error checking follow status:", error)
    }
  }

  const handleFollow = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to follow users")
      return
    }

    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      })
      
      if (response.ok) {
        setIsFollowing(!isFollowing)
        toast.success(isFollowing ? "Unfollowed" : "Followed")
        
        // Update follower count
        if (profile) {
          setProfile(prev => prev ? {
            ...prev,
            followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
          } : null)
        }
      }
    } catch (error) {
      console.error("Error following user:", error)
      toast.error("Failed to follow user")
    }
  }

  const handleLike = async (postId: string) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to like posts")
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })
      
      if (response.ok) {
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, liked: !post.liked, likesCount: post.liked ? post.likesCount - 1 : post.likesCount + 1 }
              : post
          )
        )
      }
    } catch (error) {
      console.error("Error liking post:", error)
      toast.error("Failed to like post")
    }
  }

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      // Reset to original data
      if (activeTab === "favorites") {
        fetchUserFavorites()
      } else if (activeTab === "liked") {
        fetchUserLikedPosts()
      }
      return
    }

    setSearchLoading(true)
    try {
      let endpoint = ""
      if (activeTab === "favorites") {
        endpoint = `/api/users/${username}/favorites?q=${encodeURIComponent(searchQuery)}`
      } else if (activeTab === "liked") {
        endpoint = `/api/users/${username}/liked-posts?q=${encodeURIComponent(searchQuery)}`
      }

      if (endpoint) {
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          if (activeTab === "favorites") {
            setFavorites(data.posts)
          } else if (activeTab === "liked") {
            setLikedPosts(data.posts)
          }
        }
      }
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Search failed")
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const clearSearch = () => {
    setSearchQuery("")
    if (activeTab === "favorites") {
      fetchUserFavorites()
    } else if (activeTab === "liked") {
      fetchUserLikedPosts()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">User not found</h1>
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile = !!(session?.user?.id && profile?.id && session.user.id === profile.id)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with back button */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="mx-auto max-w-lg flex items-center gap-3 py-3 px-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">
              {profile.businessName || `@${profile.username}`}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {profile.postsCount} posts • {profile.followersCount} followers
            </p>
          </div>
          {isOwnProfile ? (
            <div className="flex gap-1.5">
              <Link href="/profile/edit">
                <Button variant="default" size="sm" className="h-7 px-3 text-xs">
                  <Edit className="w-3 h-3 mr-1.5" />
                  Edit
                </Button>
              </Link>
              {profile.role === "PRO" && (
                <Link href="/pro/profile/customize">
                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
                    <Settings className="w-3 h-3 mr-1.5" />
                    Customize
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex gap-1.5">
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className="h-7 px-3 text-xs"
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </Button>
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs" onClick={() => {
                if (!session?.user?.id) { toast.error("Please sign in to message"); return }
                window.location.href = `/conversations/new?to=${profile.id}`
              }}>
                <MessageCircle className="w-3 h-3 mr-1.5" />
                Message
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {profile.coverImage && (
        <div className="relative w-full bg-background">
          <div className="mx-auto max-w-lg">
            <div className="relative h-40 w-full">
              <img
                src={profile.coverImage}
                alt="Cover"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Profile Info */}
      <div className="px-4 pt-4 mx-auto max-w-lg">
        <div className="flex items-end gap-4 mb-6">
          <Avatar className="w-24 h-24 border-4 border-background">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback className="bg-muted text-2xl font-bold">
              {profile.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-foreground">
                {profile.businessName || `${profile.firstName} ${profile.lastName}`}
              </h2>
              {profile.verified && (
                <Badge variant="default" className="bg-blue-500">
                  ✓ Verified
                </Badge>
              )}
              {profile.role === "PRO" && (
                <Badge variant="outline" className="border-primary text-primary">
                  <Briefcase className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-6 text-sm">
          <div className="text-center">
            <div className="font-bold text-foreground">{profile.postsCount}</div>
            <div className="text-muted-foreground">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-foreground">{profile.followersCount}</div>
            <div className="text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-foreground">{profile.followingCount}</div>
            <div className="text-muted-foreground">Following</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-foreground">{profile.profileViews}</div>
            <div className="text-muted-foreground">Views</div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-foreground mb-4">{profile.bio}</p>
        )}

        {/* Details */}
        <div className="space-y-2 mb-6 text-sm">
          {profile.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {profile.location}
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {profile.website}
              </a>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              {profile.phone}
            </div>
          )}
          {profile.hourlyRate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="w-4 h-4" />
              €{profile.hourlyRate}/hour
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Member since {new Date(profile.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Specialties */}
        {profile.specialties && profile.specialties.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2 text-foreground">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6 mx-auto max-w-lg">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "posts"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Posts ({profile.postsCount})
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "about"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            About
          </button>
          {profile.role === "PRO" && (
            <button
              onClick={() => setActiveTab("portfolio")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "portfolio"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Portfolio
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 mx-auto max-w-lg">
        {activeTab === "posts" && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="card">
                <div className="p-4">
                  <p className="text-foreground mb-3">{post.content}</p>
                  
                  {post.images.length > 0 && (
                    <div className="mb-3">
                      <div className="aspect-square overflow-hidden rounded-lg">
                        <img 
                          src={post.images[0]} 
                          alt="Post image"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
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
                           className={`flex items-center space-x-1 transition-colors ${
                             post.liked ? "text-red-500" : "hover:text-red-400"
                           }`}
                         >
                           <Heart className={`w-4 h-4 ${post.liked ? "fill-current text-red-500" : ""}`} />
                           <span className={post.liked ? "text-red-500" : ""}>{post.likesCount}</span>
                         </button>
                         <div className="flex items-center space-x-1">
                           <MessageCircle className="w-4 h-4" />
                           <span>{post.commentsCount}</span>
                         </div>
                         <div className="flex items-center space-x-1">
                           <Eye className="w-4 h-4" />
                           <span>{post.viewsCount}</span>
                         </div>
                       </div>
                       <span className="text-xs text-muted-foreground">
                         {new Date(post.publishedAt || post.createdAt || Date.now()).toLocaleDateString()}
                       </span>
                     </div>
                </div>
              </div>
            ))}
            
            {posts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile 
                    ? "Start sharing your artwork with the community!" 
                    : "This user hasn't posted anything yet."
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 text-foreground">About</h3>
              <p className="text-foreground">
                {profile.bio || "No bio available."}
              </p>
            </div>
            
            {profile.role === "PRO" && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-3 text-foreground">Professional Information</h3>
                <div className="space-y-2">
                  {profile.businessName && (
                    <div>
                      <span className="font-medium text-foreground">Business:</span> {profile.businessName}
                    </div>
                  )}
                  {profile.hourlyRate && (
                    <div>
                      <span className="font-medium text-foreground">Hourly Rate:</span> €{profile.hourlyRate}
                    </div>
                  )}
                  {profile.specialties && profile.specialties.length > 0 && (
                    <div>
                      <span className="font-medium text-foreground">Specialties:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profile.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "portfolio" && profile.role === "PRO" && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Portfolio</h3>
              <p className="text-muted-foreground">
                Portfolio feature coming soon! This will showcase the artist's best work.
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
