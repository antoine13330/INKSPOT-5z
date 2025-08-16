"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Send, X } from "lucide-react"
import { toast } from "sonner"

interface ReviewFormProps {
  targetUserId: string
  targetUsername: string
  onReviewSubmitted: () => void
  onClose: () => void
}

export function ReviewForm({ targetUserId, targetUsername, onReviewSubmitted, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error("Veuillez sélectionner une note")
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          rating,
          comment: comment.trim() || undefined,
        }),
      })

      if (response.ok) {
        toast.success("Avis envoyé avec succès !")
        onReviewSubmitted()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erreur lors de l'envoi de l'avis")
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error("Erreur lors de l'envoi de l'avis")
    } finally {
      setSubmitting(false)
    }
  }

  const handleStarClick = (starRating: number) => {
    setRating(starRating)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Laisser un avis</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Évaluez votre expérience avec <span className="font-semibold">@{targetUsername}</span>
            </p>
            
            {/* Rating Stars */}
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="focus:outline-none transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <p className="text-xs text-muted-foreground mt-1">
              {rating > 0 && `${rating}/5 étoiles`}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="text-sm font-medium text-foreground">
              Commentaire (optionnel)
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience..."
              className="mt-1"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitting || rating === 0}
            className="w-full"
          >
            {submitting ? (
              "Envoi en cours..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer l'avis
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
