"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Settings
} from "lucide-react"
import Image from "next/image"

interface User {
  id: string
  username: string
  firstName?: string
  lastName?: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  phone?: string
  specialties: string[]
  role: string
  businessName?: string
}

interface UserStats {
  postsCount: number
  followersCount: number
  followingCount: number
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
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

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
        setUser(userData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
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
      console.error("Error fetching user stats:", error)
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
      console.error("Error fetching user posts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md modern-card">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Not Signed In</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to view your profile.
            </p>
            <Link href="/auth/login">
              <Button className="modern-button bg-primary hover:bg-primary/90 text-primary-foreground">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
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
        {/* Profile Header */}
        <Card className="modern-card mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="modern-avatar w-20 h-20">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xl">
                      {user?.businessName?.[0] || user?.firstName?.[0] || user?.username?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-foreground">
                    {user?.businessName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.username}
                  </h1>
                  <p className="text-muted-foreground">@{user?.username}</p>
                  <Badge variant={user?.role === "PRO" ? "default" : "secondary"} className="modern-badge mt-1">
                    {user?.role === "PRO" ? "Professional Artist" : "Client"}
                  </Badge>
                </div>
              </div>
              <Link href="/profile/edit">
                <Button variant="outline" size="icon" className="modern-button">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Bio */}
            {user?.bio && (
              <p className="text-foreground mb-4">{user.bio}</p>
            )}

            {/* Contact Info */}
            <div className="space-y-2">
              {user?.location && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
              )}
              {user?.website && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {user.website}
                  </a>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            {/* Specialties */}
            {user?.specialties && user.specialties.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-foreground mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {user.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="modern-badge">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && (
          <Card className="modern-card mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.postsCount}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.followersCount}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{stats.followingCount}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Posts</h2>
            {user?.role === "PRO" && (
              <Link href="/posts/create">
                <Button className="modern-button bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </Link>
            )}
          </div>

          {posts.length > 0 ? (
            <div className="posts-grid">
              {posts.map((post) => (
                <div key={post.id} className="post-card">
                  {/* Post Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {post.isCollaboration && (
                          <Badge variant="outline" className="modern-badge border-primary text-primary">
                            <Users className="w-3 h-3 mr-1" />
                            Collab
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-4">
                    <p className="text-foreground mb-4">{post.content}</p>
                    
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="modern-card">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-6 h-6 text-muted-foreground" />
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
                    <Button className="modern-button bg-primary hover:bg-primary/90 text-primary-foreground">
                      Create Your First Post
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
