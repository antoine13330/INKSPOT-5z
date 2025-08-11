"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Reply, Edit, Trash2, Send, X, Check, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { cn, formatDate } from "@/lib/utils"

interface Comment {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    username: string
    avatar?: string
    verified: boolean
    role: string
  }
  replies: Comment[]
  _count: {
    replies: number
  }
}

interface CommentsSectionProps {
  postId: string
  postAuthorId: string
  onCommentCountChange?: (count: number) => void
}

export function CommentsSection({ postId, postAuthorId, onCommentCountChange }: CommentsSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [showAllComments, setShowAllComments] = useState(false)

  // Charger les commentaires
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
        onCommentCountChange?.(data.comments.length)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast.error("Erreur lors du chargement des commentaires")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postId])

  // Ajouter un commentaire
  const handleAddComment = async () => {
    if (!newComment.trim()) return

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
        onCommentCountChange?.(comments.length + 1)
        toast.success("Commentaire ajouté !")
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de l'ajout du commentaire")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Erreur lors de l'ajout du commentaire")
    }
  }

  // Répondre à un commentaire
  const handleReply = async (commentId: string, content: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, parentCommentId: commentId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Mettre à jour les commentaires avec la nouvelle réponse
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId 
              ? { ...comment, replies: [...comment.replies, data.comment] }
              : comment
          )
        )
        setReplyingTo(null)
        toast.success("Réponse ajoutée !")
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de l'ajout de la réponse")
      }
    } catch (error) {
      console.error("Error adding reply:", error)
      toast.error("Erreur lors de l'ajout de la réponse")
    }
  }

  // Modifier un commentaire
  const handleEdit = async (commentId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId 
              ? { ...comment, content: data.comment.content }
              : comment
          )
        )
        setEditingComment(null)
        setEditContent("")
        toast.success("Commentaire modifié !")
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de la modification")
      }
    } catch (error) {
      console.error("Error editing comment:", error)
      toast.error("Erreur lors de la modification")
    }
  }

  // Supprimer un commentaire
  const handleDelete = async (commentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId))
        onCommentCountChange?.(comments.length - 1)
        toast.success("Commentaire supprimé !")
      } else {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de la suppression")
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  // Composant pour afficher un commentaire
  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const canReply = session?.user?.id === postAuthorId && !isReply
    const canEdit = session?.user?.id === comment.author.id
    const canDelete = session?.user?.id === comment.author.id || session?.user?.id === postAuthorId

    return (
      <div className={cn("space-y-3", isReply && "ml-8 border-l-2 border-muted pl-4")}>
        <div className="flex items-start space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author.avatar} />
            <AvatarFallback>{comment.author.username[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm">{comment.author.username}</span>
              {comment.author.verified && (
                <Badge variant="secondary" className="text-xs">✓</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Modifier le commentaire..."
                  className="text-sm"
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => handleEdit(comment.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingComment(null)
                      setEditContent("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground">{comment.content}</p>
            )}

            <div className="flex items-center space-x-4 mt-2">
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Répondre
                </Button>
              )}
              
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingComment(comment.id)
                    setEditContent(comment.content)
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Modifier
                </Button>
              )}
              
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Zone de réponse */}
        {replyingTo === comment.id && (
          <div className="ml-11 space-y-2">
            <Input
              placeholder="Écrire une réponse..."
              className="text-sm"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement
                  if (target.value.trim()) {
                    handleReply(comment.id, target.value.trim())
                    target.value = ""
                  }
                }
              }}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={() => {
                const input = document.querySelector(`input[placeholder="Écrire une réponse..."]`) as HTMLInputElement
                if (input?.value.trim()) {
                  handleReply(comment.id, input.value.trim())
                  input.value = ""
                }
              }}>
                <Send className="h-4 w-4 mr-1" />
                Répondre
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setReplyingTo(null)}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Réponses */}
        {comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3">
              <div className="h-8 w-8 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const displayedComments = showAllComments ? comments : comments.slice(0, 3)

  return (
    <div className="space-y-4">
      {/* Zone d'ajout de commentaire */}
      {session && (
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user?.image || ""} />
            <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Ajouter un commentaire..."
              onKeyPress={(e) => {
                if (e.key === "Enter" && newComment.trim()) {
                  handleAddComment()
                }
              }}
            />
            <div className="flex justify-end">
              <Button 
                size="sm" 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Send className="h-4 w-4 mr-1" />
                Commenter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des commentaires */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {displayedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
          
          {comments.length > 3 && (
            <Button
              variant="outline"
              onClick={() => setShowAllComments(!showAllComments)}
              className="w-full"
            >
              {showAllComments ? "Voir moins" : `Voir tous les commentaires (${comments.length})`}
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucun commentaire pour le moment</p>
          <p className="text-sm">Soyez le premier à commenter !</p>
        </div>
      )}
    </div>
  )
}
