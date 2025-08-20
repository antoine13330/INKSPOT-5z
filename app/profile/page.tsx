"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
import { 
  Edit, 
  Camera, 
  MapPin, 
  Globe, 
  Phone, 
  Briefcase,
  Heart,
  MessageCircle,
  Eye,
  Users,
  LogOut,
  Star,
  Calendar,
  Settings,
  ArrowLeft
} from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  username: string
  firstName?: string
  lastName?: string
  email: string
  avatar?: string
  coverImage?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  specialties: string[]
  role: string
  businessName?: string
  hourlyRate?: number
  createdAt: string
}

interface UserStats {
  postsCount: number
  followersCount: number
  followingCount: number
  profileViews: number
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
  isCollaboration: boolean
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"posts" | "about" | "portfolio">("posts")

  // Rediriger vers la vue publique du profil pour unifier l'UI
  useEffect(() => {
    if (session?.user?.username) {
      router.replace(`/profile/${session.user.username}`)
    }
  }, [session?.user?.username, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData()
      fetchUserStats()
      fetchUserPosts()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching user data:", error)
      }
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}/stats`)
      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching user stats:", error)
      }
    }
  }

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`/api/posts?userId=${session?.user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching user posts:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" })
      toast.success("Déconnexion réussie")
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Erreur lors de la déconnexion:", error)
      }
      toast.error("Erreur lors de la déconnexion")
    }
  }

  if (!session) {
    return null
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
              {user?.businessName || `@${user?.username}`}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {stats?.postsCount || 0} posts • {stats?.followersCount || 0} followers
            </p>
          </div>
          <div className="flex gap-1.5">
            <Link href="/profile/edit">
              <Button variant="default" size="sm" className="h-7 px-3 text-xs">
                <Edit className="w-3 h-3 mr-1.5" />
                Edit
              </Button>
            </Link>
            {user?.role === "PRO" && (
              <Link href="/pro/profile/customize">
                <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
                  <Settings className="w-3 h-3 mr-1.5" />
                  Customize
                </Button>
              </Link>
            )}
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 px-3 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleSignOut}
              title="Se déconnecter"
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {user?.coverImage && (
        <div className="relative w-full bg-background">
          <div className="mx-auto max-w-lg">
            <div className="relative h-40 w-full">
              <img
                src={user.coverImage}
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
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-muted text-2xl font-bold">
              {user?.businessName?.[0] || user?.firstName?.[0] || user?.username?.[0]}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 mb-2">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-foreground">
                {user?.businessName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username}
              </h2>
              {user?.role === "PRO" && (
                <Badge variant="outline" className="border-primary text-primary">
                  <Briefcase className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">@{user?.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-6 text-sm">
          <div className="text-center">
            <div className="font-bold text-foreground">{stats?.postsCount || 0}</div>
            <div className="text-muted-foreground">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-foreground">{stats?.followersCount || 0}</div>
            <div className="text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-foreground">{stats?.followingCount || 0}</div>
            <div className="text-muted-foreground">Following</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-foreground">{stats?.profileViews || 0}</div>
            <div className="text-muted-foreground">Views</div>
          </div>
        </div>

        {/* Bio */}
        {user?.bio && (
          <p className="text-foreground mb-4">{user.bio}</p>
        )}

        {/* Details */}
        <div className="space-y-2 mb-6 text-sm">
          {user?.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {user.location}
            </div>
          )}
          {user?.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {user.website}
              </a>
            </div>
          )}
          {user?.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              {user.phone}
            </div>
          )}
          {user?.hourlyRate && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="w-4 h-4" />
              €{user.hourlyRate}/hour
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </div>
        </div>

        {/* Specialties */}
        {user?.specialties && user.specialties.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2 text-foreground">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {user.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary">
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
            Posts ({stats?.postsCount || 0})
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
          {user?.role === "PRO" && (
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
            {posts.length > 0 ? (
              posts.map((post) => (
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
                        {post.hashtags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          {post.likesCount}
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.commentsCount}
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          {post.viewsCount}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">
                  {user?.role === "PRO" 
                    ? "Start sharing your artwork with the community!" 
                    : "Follow artists to see their posts here."
                  }
                </p>
                {user?.role === "PRO" && (
                  <Link href="/posts/create">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Create Your First Post
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "about" && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 text-foreground">About</h3>
              <p className="text-foreground">
                {user?.bio || "No bio available."}
              </p>
            </div>
            
            {user?.role === "PRO" && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-3 text-foreground">Professional Information</h3>
                <div className="space-y-2">
                  {user.businessName && (
                    <div>
                      <span className="font-medium text-foreground">Business:</span> {user.businessName}
                    </div>
                  )}
                  {user.hourlyRate && (
                    <div>
                      <span className="font-medium text-foreground">Hourly Rate:</span> €{user.hourlyRate}
                    </div>
                  )}
                  {user.specialties && user.specialties.length > 0 && (
                    <div>
                      <span className="font-medium text-foreground">Specialties:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary">
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

        {activeTab === "portfolio" && user?.role === "PRO" && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Portfolio</h3>
              <p className="text-muted-foreground">
                Portfolio feature coming soon! This will showcase your best work.
              </p>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
