"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNavigation } from "@/components/bottom-navigation"
import { CommentsSection } from "@/components/comments-section"
import { 
  Heart, 
  MessageCircle, 
  Star, 
  Share2, 
  MoreHorizontal,
  ArrowLeft,
  Eye,
  DollarSign,
  CheckCircle,
  Mail,
  Link as LinkIcon,
  Instagram,
  MessageCircle as WhatsApp,
  Copy,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { cn, formatDate } from "@/lib/utils"

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
  favorited?: boolean
}

export default function PostPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)

  const postId = params.postId as string

  useEffect(() => {
    if (postId) {
      fetchPost()
    }
  }, [postId])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data.post)
        setLiked(data.post.liked || false)
        setFavorited(data.post.favorited || false)
      } else {
        toast.error("Post non trouvé")
        router.push("/")
      }
    } catch (error) {
      console.error("Error fetching post:", error)
      toast.error("Erreur lors du chargement du post")
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!session) {
      toast.error("Vous devez être connecté pour liker")
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      })
      
      if (response.ok) {
        setLiked(!liked)
        setPost(prev => prev ? {
          ...prev,
          likesCount: liked ? prev.likesCount - 1 : prev.likesCount + 1
        } : null)
        toast.success(liked ? "Like retiré" : "Post liké !")
      }
    } catch (error) {
      console.error("Error liking post:", error)
      toast.error("Erreur lors du like")
    }
  }

  const handleFavorite = async () => {
    if (!session) {
      toast.error("Vous devez être connecté pour ajouter aux favoris")
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/favorite`, {
        method: "POST",
      })
      
      if (response.ok) {
        setFavorited(!favorited)
        toast.success(favorited ? "Retiré des favoris" : "Ajouté aux favoris !")
      }
    } catch (error) {
      console.error("Error favoriting post:", error)
      toast.error("Erreur lors de l'ajout aux favoris")
    }
  }

  const handleShare = async (method: string) => {
    if (!post) return

    const postUrl = `${window.location.origin}/posts/${postId}`
    const postTitle = `Post de ${post.author.username} sur INKSPOT`
    const postText = post.content.substring(0, 100) + (post.content.length > 100 ? "..." : "")

    try {
      switch (method) {
        case "link":
          await navigator.clipboard.writeText(postUrl)
          toast.success("Lien copié dans le presse-papiers !")
          break

        case "email":
          const emailSubject = encodeURIComponent(postTitle)
          const emailBody = encodeURIComponent(`${postText}\n\nVoir le post : ${postUrl}`)
          window.open(`mailto:?subject=${emailSubject}&body=${emailBody}`)
          break

        case "whatsapp":
          const whatsappText = encodeURIComponent(`${postText}\n\nVoir le post : ${postUrl}`)
          window.open(`https://wa.me/?text=${whatsappText}`)
          break

        case "instagram":
          // Instagram ne supporte pas le partage direct via URL
          await navigator.clipboard.writeText(postUrl)
          toast.success("Lien copié ! Collez-le dans votre story Instagram")
          break

        case "native":
          if (navigator.share) {
            await navigator.share({
              title: postTitle,
              text: postText,
              url: postUrl,
            })
          } else {
            await navigator.clipboard.writeText(postUrl)
            toast.success("Lien copié dans le presse-papiers !")
          }
          break
      }
      setShowShareMenu(false)
    } catch (error) {
      console.error("Error sharing:", error)
      toast.error("Erreur lors du partage")
    }
  }

  const isPWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Post non trouvé</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-2"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Menu de partage */}
        {showShareMenu && (
          <div className="absolute top-full right-4 bg-card border border-border rounded-lg shadow-lg p-2 z-50 min-w-48">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare("native")}
                className="w-full justify-start"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare("link")}
                className="w-full justify-start"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Copier le lien
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare("email")}
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Partager par email
              </Button>
              
              {isPWA() && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("whatsapp")}
                    className="w-full justify-start"
                  >
                    <WhatsApp className="h-4 w-4 mr-2" />
                    Partager sur WhatsApp
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare("instagram")}
                    className="w-full justify-start"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Partager sur Instagram
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Menu d'actions */}
        {showActionsMenu && (
          <div className="absolute top-full right-4 bg-card border border-border rounded-lg shadow-lg p-2 z-50 min-w-48">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowActionsMenu(false)
                  // Ajouter d'autres actions ici
                }}
                className="w-full justify-start"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir le profil
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contenu du post */}
      <div className="p-4 space-y-4">
        {/* En-tête du post */}
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={post.author.avatar} />
            <AvatarFallback>{post.author.username[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold">{post.author.username}</span>
              {post.author.verified && (
                <Badge variant="secondary" className="text-xs">✓</Badge>
              )}
              {post.author.businessName && (
                <span className="text-sm text-muted-foreground">
                  {post.author.businessName}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{formatDate(post.publishedAt)}</span>
              <span>•</span>
              <span className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {post.viewsCount} vues
              </span>
            </div>
          </div>
        </div>

        {/* Contenu textuel */}
        <div className="space-y-3">
          <p className="text-foreground leading-relaxed">{post.content}</p>
          
          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        {post.images.length > 0 && (
          <div className="space-y-3">
            {post.images.map((image, index) => (
              <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                  src={image}
                  alt={`Image ${index + 1} du post`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Informations du post */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
          {post.price && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium">{post.price}€</span>
            </div>
          )}
          
          {post.isCollaboration && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">
                Collaboration disponible
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                "flex items-center space-x-2",
                liked && "text-red-500"
              )}
            >
              <Heart className={cn("h-5 w-5", liked && "fill-current")} />
              <span>{post.likesCount}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{post.commentsCount}</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className={cn(
                "p-2",
                favorited && "text-yellow-500"
              )}
            >
              <Star className={cn("h-5 w-5", favorited && "fill-current")} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-2"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Section commentaires */}
      <div className="border-t border-border">
        <div className="p-4">
          <h3 className="font-semibold mb-4">Commentaires</h3>
          <CommentsSection 
            postId={postId} 
            postAuthorId={post.author.id}
            onCommentCountChange={(count) => {
              setPost(prev => prev ? { ...prev, commentsCount: count } : null)
            }}
          />
        </div>
      </div>

      {/* Navigation du bas */}
      <BottomNavigation />
    </div>
  )
}
