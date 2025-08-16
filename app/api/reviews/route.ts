import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Type for review with include fields from Prisma query
interface ReviewWithReviewer {
  id: string
  rating: number
  comment: string | null
  createdAt: Date
  reviewer: {
    id: string
    username: string
    firstName: string | null
    lastName: string | null
    avatar: string | null
  }
}

export const dynamic = "force-dynamic"

// Créer un avis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { targetUserId, rating, comment } = await request.json()

    if (!targetUserId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating data" }, { status: 400 })
    }

    // Vérifier que l'utilisateur ne s'évalue pas lui-même
    if (session.user.id === targetUserId) {
      return NextResponse.json({ error: "Cannot review yourself" }, { status: 400 })
    }

    // Vérifier si l'utilisateur a déjà laissé un avis
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_reviewedId: {
          reviewerId: session.user.id,
          reviewedId: targetUserId,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this user" }, { status: 400 })
    }

    // Créer l'avis
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment || null,
        reviewerId: session.user.id,
        reviewedId: targetUserId,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        reviewed: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    // Créer une notification pour l'utilisateur évalué
    await prisma.notification.create({
      data: {
        title: "Nouvel avis reçu",
        message: `@${session.user.username} vous a laissé un avis de ${rating}/5 étoiles`,
        type: "REVIEW",
        userId: targetUserId,
        data: {
          reviewId: review.id,
          rating,
          hasComment: !!comment,
        },
      },
    })

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        reviewer: review.reviewer,
      },
    })

  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
  }
}

// Récupérer les avis d'un utilisateur
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const skip = (page - 1) * limit

    // Récupérer les avis reçus
    const [reviews, total]: [ReviewWithReviewer[], number] = await Promise.all([
      prisma.review.findMany({
        where: { reviewedId: userId },
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: { reviewedId: userId },
      }),
    ])

    // Calculer la note moyenne
    const averageRating = await prisma.review.aggregate({
      where: { reviewedId: userId },
      _avg: { rating: true },
    })

    return NextResponse.json({
      success: true,
      reviews: reviews.map((review: ReviewWithReviewer) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        reviewer: review.reviewer,
      })),
      averageRating: averageRating._avg.rating || 0,
      totalReviews: total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

// Mettre à jour un avis
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reviewId, rating, comment } = await request.json()

    if (!reviewId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid review data" }, { status: 400 })
    }

    // Vérifier que l'utilisateur est bien l'auteur de l'avis
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (existingReview.reviewerId !== session.user.id) {
      return NextResponse.json({ error: "Cannot edit this review" }, { status: 403 })
    }

    // Mettre à jour l'avis
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment: comment || null,
        updatedAt: new Date(),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        createdAt: updatedReview.createdAt.toISOString(),
        updatedAt: updatedReview.updatedAt.toISOString(),
        reviewer: updatedReview.reviewer,
      },
    })

  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 })
  }
}

// Supprimer un avis
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reviewId = searchParams.get("reviewId")

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID required" }, { status: 400 })
    }

    // Vérifier que l'utilisateur est bien l'auteur de l'avis
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 })
    }

    if (existingReview.reviewerId !== session.user.id) {
      return NextResponse.json({ error: "Cannot delete this review" }, { status: 403 })
    }

    // Supprimer l'avis
    await prisma.review.delete({
      where: { id: reviewId },
    })

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
    })

  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
