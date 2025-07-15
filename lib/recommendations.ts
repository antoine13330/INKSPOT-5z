import { prisma } from "./prisma"

interface UserInteractionScore {
  userId: string
  score: number
  commonHashtags: string[]
  interactionCount: number
}

export async function calculateRecommendationScore(currentUserId: string): Promise<UserInteractionScore[]> {
  // Get user's interaction history
  const userInteractions = await prisma.userInteraction.findMany({
    where: { userId: currentUserId },
    include: {
      targetUser: {
        select: {
          id: true,
          username: true,
          role: true,
          specialties: true,
          posts: {
            select: {
              hashtags: true,
            },
            take: 10,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  })

  // Get user's search history
  const searchHistory = await prisma.searchHistory.findMany({
    where: { userId: currentUserId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Extract hashtags from search history
  const searchedHashtags = searchHistory.flatMap((search) => search.hashtags)
  const hashtagFrequency = searchedHashtags.reduce(
    (acc, hashtag) => {
      acc[hashtag] = (acc[hashtag] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Calculate scores for each interacted user
  const userScores: Record<string, UserInteractionScore> = {}

  for (const interaction of userInteractions) {
    const targetUserId = interaction.targetUserId
    const targetUser = interaction.targetUser

    if (!userScores[targetUserId]) {
      userScores[targetUserId] = {
        userId: targetUserId,
        score: 0,
        commonHashtags: [],
        interactionCount: 0,
      }
    }

    // Base interaction score
    const interactionWeight = getInteractionWeight(interaction.interactionType)
    userScores[targetUserId].score += interactionWeight * interaction.weight
    userScores[targetUserId].interactionCount++

    // Hashtag similarity bonus
    const userHashtags = targetUser.posts.flatMap((post) => post.hashtags)
    const commonHashtags = userHashtags.filter((hashtag) => hashtagFrequency[hashtag])

    userScores[targetUserId].commonHashtags = [
      ...new Set([...userScores[targetUserId].commonHashtags, ...commonHashtags]),
    ]

    // Boost score based on common hashtags
    const hashtagBonus = commonHashtags.reduce((sum, hashtag) => sum + (hashtagFrequency[hashtag] || 0), 0)
    userScores[targetUserId].score += hashtagBonus * 0.5

    // Recency bonus (more recent interactions get higher weight)
    const daysSinceInteraction = (Date.now() - interaction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const recencyBonus = Math.max(0, 1 - daysSinceInteraction / 30) // Decay over 30 days
    userScores[targetUserId].score += recencyBonus * 2
  }

  return Object.values(userScores).sort((a, b) => b.score - a.score)
}

function getInteractionWeight(interactionType: string): number {
  const weights = {
    view: 1,
    like: 2,
    comment: 3,
    message: 4,
    book: 5,
  }
  return weights[interactionType as keyof typeof weights] || 1
}

export async function getRecommendedPosts(userId: string, limit = 20) {
  const userScores = await calculateRecommendationScore(userId)
  const recommendedUserIds = userScores.slice(0, 10).map((score) => score.userId)

  // Get user's search history for hashtag preferences
  const searchHistory = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  const preferredHashtags = searchHistory.flatMap((search) => search.hashtags)

  // Get posts from recommended users and posts with preferred hashtags
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        {
          authorId: {
            in: recommendedUserIds,
          },
        },
        {
          hashtags: {
            hasSome: preferredHashtags,
          },
        },
      ],
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
          role: true,
          verified: true,
          businessName: true,
          specialties: true,
          hourlyRate: true,
        },
      },
      likes: userId
        ? {
            where: {
              userId,
            },
          }
        : false,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      {
        likesCount: "desc",
      },
    ],
    take: limit,
  })

  return posts.map((post) => ({
    ...post,
    liked: userId ? post.likes.length > 0 : false,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
  }))
}

export async function recordUserInteraction(userId: string, targetUserId: string, interactionType: string, weight = 1) {
  if (userId === targetUserId) return // Don't record self-interactions

  await prisma.userInteraction.create({
    data: {
      userId,
      targetUserId,
      interactionType,
      weight,
    },
  })

  // Update target user's profile views if it's a view interaction
  if (interactionType === "view") {
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        profileViews: {
          increment: 1,
        },
      },
    })
  }
}
