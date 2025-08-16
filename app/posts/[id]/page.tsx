"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BottomNavigation } from "@/components/bottom-navigation"
import { 
  ArrowLeft,
  Heart,
  Star,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Users,
  Eye,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { MentionHighlighter } from "@/components/mention-highlighter"

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

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    businessName?: string
    avatar?: string
  }
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const postId = params?.id as string
  
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [favoritedPosts, setFavoritedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (postId) {
      fetchPost()
      fetchComments()
      checkFavoriteStatus()
    }
  }, [postId])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data.post)
      } else {
        toast.error("Post not found")
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching post:", error)
      toast.error("Failed to load post")
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const checkFavoriteStatus = async () => {
    if (!session?.user?.id) return
    
    try {
      // Check if post is in favorites (you might need to implement this API)
      // For now, we'll use localStorage or a simple check
      const favorites = localStorage.getItem("favoritedPosts")
      if (favorites) {
        const favoritedIds = JSON.parse(favorites)
        setFavoritedPosts(new Set(favoritedIds))
      }
    } catch (error) {
      console.error("Error checking favorite status:", error)
    }
  }

  const handleLike = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to like posts")
      return
    }

    if (!post) return

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
      })
      
      if (response.ok) {
        setPost(prev => prev ? {
          ...prev,
          liked: !prev.liked,
          likesCount: prev.liked ? prev.likesCount - 1 : prev.likesCount + 1
        } : null)
        toast.success(post.liked ? "Post unliked!" : "Post liked!")
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
        // Update localStorage
        const favorites = Array.from(newSet)
        localStorage.setItem("favoritedPosts", JSON.stringify(favorites))
      } else {
        newSet.add(postId)
        toast.success("Added to favorites")
        // Update localStorage
        const favorites = Array.from(newSet)
        localStorage.setItem("favoritedPosts", JSON.stringify(favorites))
      }
      return newSet
    })
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !session?.user?.id) {
      toast.error("Please sign in and enter a comment")
      return
    }

    setCommentLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => [data.comment, ...prev])
        setNewComment("")
        toast.success("Comment added!")
        
        // Update comment count
        if (post) {
          setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null)
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    } finally {
      setCommentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post not found</h1>
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">Post</h1>
            <p className="text-sm text-muted-foreground">
              by @{post.author.username}
            </p>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <div className="card">
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
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Price */}
            {post.price && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
                <span className="text-2xl">💰</span>
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
                  onClick={handleLike}
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
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {post.commentsCount} comments
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.viewsCount} views
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Comments ({post.commentsCount})
          </h3>

          {/* Add Comment */}
          {session?.user?.id && (
            <div className="card mb-4">
              <form onSubmit={handleCommentSubmit} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={session.user.avatar || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {session.user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      disabled={commentLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!newComment.trim() || commentLoading}
                    className="ml-2"
                  >
                    {commentLoading ? "Posting..." : "Post"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="card">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Link href={`/profile/${comment.author.username}`}>
                      <Avatar className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {comment.author.username[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/profile/${comment.author.username}`} className="hover:opacity-80 transition-opacity">
                          <span className="font-semibold text-foreground">
                            {comment.author.businessName || comment.author.username}
                          </span>
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-foreground">
                        <MentionHighlighter text={comment.content} />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
