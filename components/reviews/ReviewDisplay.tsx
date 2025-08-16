"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, MessageCircle, ThumbsUp, Calendar } from "lucide-react"
import Link from "next/link"

interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  reviewer: {
    id: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
  }
}

interface ReviewDisplayProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
  showReviewForm?: boolean
  onShowReviewForm?: () => void
  targetUserId: string
  targetUsername: string
}

export function ReviewDisplay({ 
  reviews, 
  averageRating, 
  totalReviews, 
  showReviewForm = false,
  onShowReviewForm,
  targetUserId,
  targetUsername
}: ReviewDisplayProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())

  const toggleReviewExpansion = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedReviews(newExpanded)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Avis et notes</span>
            {onShowReviewForm && (
              <Button onClick={onShowReviewForm} variant="outline" size="sm">
                <Star className="w-4 h-4 mr-2" />
                Laisser un avis
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mt-1">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {totalReviews} avis
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter(r => r.rating === star).length
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
                
                return (
                  <div key={star} className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground w-8">
                      {star} <Star className="w-3 h-3 inline text-yellow-400 fill-current" />
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tous les avis</h3>
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={review.reviewer.avatar} />
                    <AvatarFallback>
                      {review.reviewer.firstName?.[0] || review.reviewer.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link 
                        href={`/profile/${review.reviewer.username}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {review.reviewer.firstName && review.reviewer.lastName
                          ? `${review.reviewer.firstName} ${review.reviewer.lastName}`
                          : `@${review.reviewer.username}`
                        }
                      </Link>
                      <Badge variant="secondary" className="text-xs">
                        {review.rating}/5
                      </Badge>
                    </div>
                    
                    <div className="mb-2">
                      {renderStars(review.rating, 'sm')}
                    </div>
                    
                    {review.comment && (
                      <div className="text-sm text-foreground">
                        {expandedReviews.has(review.id) || review.comment.length <= 150
                          ? review.comment
                          : (
                            <>
                              {review.comment.substring(0, 150)}...
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-primary"
                                onClick={() => toggleReviewExpansion(review.id)}
                              >
                                Lire la suite
                              </Button>
                            </>
                          )
                        }
                        {expandedReviews.has(review.id) && review.comment.length > 150 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-primary ml-2"
                            onClick={() => toggleReviewExpansion(review.id)}
                          >
                            Voir moins
                          </Button>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aucun avis pour le moment
            </h3>
            <p className="text-muted-foreground mb-4">
              Soyez le premier à laisser un avis pour @{targetUsername}
            </p>
            {onShowReviewForm && (
              <Button onClick={onShowReviewForm}>
                <Star className="w-4 h-4 mr-2" />
                Laisser le premier avis
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
