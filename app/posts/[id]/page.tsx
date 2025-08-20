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
// Removed next/image import - not used
import { MentionHighlighter } from "@/components/mention-highlighter"
import { ImageCarousel } from "@/components/image-carousel"

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
        console.log("Fetched comments:", data.comments) // Debug log
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
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">Post</h1>
            <p className="text-sm text-muted-foreground truncate">
              by @{post.author.username}
            </p>
          </div>
        </div>
      </div>

      {/* Post Content - Mobile Optimized */}
      <div className="p-4 space-y-4">
        <div className="card">
          {/* Post Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <Link href={`/profile/${post.author.username}`}>
                  <Avatar className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {post.author.username[0]}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${post.author.username}`} className="hover:opacity-80 transition-opacity">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-foreground truncate">
                        {post.author.businessName || post.author.username}
                      </span>
                      {post.isCollaboration && (
                        <Badge variant="outline" className="border-primary text-primary text-xs">
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
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Post Content */}
          <div className="p-4">
            <p className="text-foreground mb-4 text-base leading-relaxed">
              <MentionHighlighter text={post.content} />
            </p>

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
              <div className="mb-4">
                <ImageCarousel images={post.images} alt="Post images" />
              </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.hashtags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Post Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-4">
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

        {/* Action Buttons - Mobile Optimized */}
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 ${post.liked ? 'text-red-500' : 'text-muted-foreground'}`}
            >
              <Heart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
              <span className="text-sm">{post.likesCount}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFavorite(post.id)}
              className={`flex items-center gap-2 ${favoritedPosts.has(post.id) ? 'text-yellow-500' : 'text-muted-foreground'}`}
            >
              <Star className={`w-5 h-5 ${favoritedPosts.has(post.id) ? 'fill-current' : ''}`} />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Comments Section - Mobile Optimized */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Comments ({post.commentsCount})
          </h3>

          {/* Add Comment */}
          {session?.user?.id && (
            <div className="bg-card rounded-lg border border-border p-4">
              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={session.user.avatar || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {session.user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                      disabled={commentLoading}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={!newComment.trim() || commentLoading}
                    className="px-4"
                  >
                    {commentLoading ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="bg-card rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <Link href={`/profile/${comment.author.username}`}>
                      <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {comment.author.username[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Link href={`/profile/${comment.author.username}`} className="hover:opacity-80 transition-opacity">
                          <span className="font-semibold text-foreground text-sm">
                            {comment.author.businessName || comment.author.username}
                          </span>
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-foreground text-sm leading-relaxed">
                        <MentionHighlighter text={comment.content} />
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
