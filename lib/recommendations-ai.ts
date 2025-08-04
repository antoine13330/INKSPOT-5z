import { prisma } from "./prisma"

interface UserProfile {
  id: string
  username: string
  role: string
  specialties: string[]
  location?: string
  bio?: string
  posts: { hashtags: string[]; createdAt: Date; likesCount: number }[]
  followers: number
  following: number
}

interface RecommendationScore {
  userId: string
  score: number
  reasons: string[]
  similarity: number
  engagement: number
  freshness: number
  location?: number
}

interface AIRecommendationParams {
  userId: string
  limit?: number
  includeLocation?: boolean
  minSimilarity?: number
  boostRecent?: boolean
  diversify?: boolean
}

/**
 * Enhanced AI-powered recommendation system
 */
export class AIRecommendationEngine {
  private static instance: AIRecommendationEngine
  private vectorCache = new Map<string, number[]>()

  static getInstance(): AIRecommendationEngine {
    if (!AIRecommendationEngine.instance) {
      AIRecommendationEngine.instance = new AIRecommendationEngine()
    }
    return AIRecommendationEngine.instance
  }

  /**
   * Generate AI-powered user recommendations
   */
  async getAIRecommendations(params: AIRecommendationParams): Promise<RecommendationScore[]> {
    const {
      userId,
      limit = 20,
      includeLocation = true,
      minSimilarity = 0.1,
      boostRecent = true,
      diversify = true
    } = params

    const currentUser = await this.getUserProfile(userId)
    if (!currentUser) return []

    const candidates = await this.getCandidateUsers(userId)
    const scores: RecommendationScore[] = []

    for (const candidate of candidates) {
      const score = await this.calculateAIScore(currentUser, candidate, {
        includeLocation,
        boostRecent
      })
      
      if (score.similarity >= minSimilarity) {
        scores.push(score)
      }
    }

    // Sort by total score
    scores.sort((a, b) => b.score - a.score)

    // Apply diversification if requested
    if (diversify) {
      return this.diversifyRecommendations(scores, limit)
    }

    return scores.slice(0, limit)
  }

  /**
   * Calculate comprehensive AI score for user similarity
   */
  private async calculateAIScore(
    currentUser: UserProfile,
    candidate: UserProfile,
    options: { includeLocation: boolean; boostRecent: boolean }
  ): Promise<RecommendationScore> {
    const reasons: string[] = []
    
    // 1. Content Similarity (30% weight)
    const contentSimilarity = this.calculateContentSimilarity(currentUser, candidate)
    if (contentSimilarity > 0.3) reasons.push("Similar content interests")

    // 2. Specialties/Skills Overlap (25% weight)
    const skillsSimilarity = this.calculateSkillsSimilarity(currentUser, candidate)
    if (skillsSimilarity > 0.2) reasons.push("Complementary skills")

    // 3. Engagement Patterns (20% weight)
    const engagementScore = this.calculateEngagementScore(candidate)
    if (engagementScore > 0.6) reasons.push("High engagement profile")

    // 4. Geographic Proximity (15% weight)
    let locationScore = 0
    if (options.includeLocation && currentUser.location && candidate.location) {
      locationScore = this.calculateLocationScore(currentUser.location, candidate.location)
      if (locationScore > 0.5) reasons.push("Nearby location")
    }

    // 5. Freshness/Activity (10% weight)
    let freshnessScore = 0
    if (options.boostRecent) {
      freshnessScore = this.calculateFreshnessScore(candidate)
      if (freshnessScore > 0.7) reasons.push("Recent activity")
    }

    // Calculate weighted final score
    const similarity = (contentSimilarity + skillsSimilarity) / 2
    const engagement = engagementScore
    const freshness = freshnessScore
    const location = locationScore

    const totalScore = 
      contentSimilarity * 0.3 +
      skillsSimilarity * 0.25 +
      engagementScore * 0.2 +
      locationScore * 0.15 +
      freshnessScore * 0.1

    return {
      userId: candidate.id,
      score: totalScore,
      reasons,
      similarity,
      engagement,
      freshness,
      location: options.includeLocation ? location : undefined
    }
  }

  /**
   * Calculate content similarity using hashtag and topic analysis
   */
  private calculateContentSimilarity(user1: UserProfile, user2: UserProfile): number {
    const user1Hashtags = this.extractUserHashtags(user1)
    const user2Hashtags = this.extractUserHashtags(user2)

    if (user1Hashtags.length === 0 || user2Hashtags.length === 0) return 0

    // Calculate Jaccard similarity
    const intersection = user1Hashtags.filter(tag => user2Hashtags.includes(tag))
    const union = [...new Set([...user1Hashtags, ...user2Hashtags])]
    
    const jaccardSimilarity = intersection.length / union.length

    // Boost for weighted hashtag frequency
    const weightedScore = this.calculateWeightedHashtagSimilarity(user1, user2)

    return (jaccardSimilarity * 0.6 + weightedScore * 0.4)
  }

  /**
   * Calculate skills/specialties similarity for professional matching
   */
  private calculateSkillsSimilarity(user1: UserProfile, user2: UserProfile): number {
    if (!user1.specialties?.length || !user2.specialties?.length) return 0

    // For PRO-CLIENT matching, look for complementary rather than identical skills
    const user1Skills = user1.specialties.map(s => s.toLowerCase())
    const user2Skills = user2.specialties.map(s => s.toLowerCase())

    if (user1.role === 'CLIENT' && user2.role === 'PRO') {
      // Client looking for PRO services
      const serviceMatch = user2Skills.some(skill => 
        user1Skills.some(need => this.areSkillsRelated(need, skill))
      )
      return serviceMatch ? 0.8 : 0.2
    } else if (user1.role === 'PRO' && user2.role === 'PRO') {
      // PRO-PRO collaboration potential
      const complementary = this.calculateComplementarySkills(user1Skills, user2Skills)
      const overlap = user1Skills.filter(skill => user2Skills.includes(skill)).length
      return (complementary * 0.7 + (overlap / Math.max(user1Skills.length, user2Skills.length)) * 0.3)
    }

    return 0
  }

  /**
   * Calculate user engagement score based on activity patterns
   */
  private calculateEngagementScore(user: UserProfile): number {
    const recentPosts = user.posts.filter(post => 
      Date.now() - post.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    )

    if (recentPosts.length === 0) return 0.1

    const avgLikes = recentPosts.reduce((sum, post) => sum + post.likesCount, 0) / recentPosts.length
    const postFrequency = recentPosts.length / 30 // Posts per day
    const socialScore = Math.min((user.followers + user.following) / 100, 1)

    return Math.min(
      (avgLikes / 50) * 0.4 + 
      Math.min(postFrequency * 10, 1) * 0.3 + 
      socialScore * 0.3,
      1
    )
  }

  /**
   * Calculate geographic proximity score
   */
  private calculateLocationScore(location1: string, location2: string): number {
    // Simple string matching for now - could be enhanced with geocoding
    const loc1 = location1.toLowerCase().trim()
    const loc2 = location2.toLowerCase().trim()

    if (loc1 === loc2) return 1.0
    
    // Check for city/region matches
    const loc1Parts = loc1.split(',').map(s => s.trim())
    const loc2Parts = loc2.split(',').map(s => s.trim())
    
    const commonParts = loc1Parts.filter(part => 
      loc2Parts.some(p => p.includes(part) || part.includes(p))
    )
    
    return Math.min(commonParts.length / Math.max(loc1Parts.length, loc2Parts.length), 1)
  }

  /**
   * Calculate content freshness/recency score
   */
  private calculateFreshnessScore(user: UserProfile): number {
    const recentPosts = user.posts.filter(post => 
      Date.now() - post.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    )

    return Math.min(recentPosts.length / 5, 1) // Max score for 5+ posts per week
  }

  /**
   * Diversify recommendations to avoid echo chambers
   */
  private diversifyRecommendations(scores: RecommendationScore[], limit: number): RecommendationScore[] {
    const diversified: RecommendationScore[] = []
    const usedReasons = new Set<string>()

    // First pass: take highest scores with diverse reasons
    for (const score of scores) {
      if (diversified.length >= limit) break
      
      const hasNewReason = score.reasons.some(reason => !usedReasons.has(reason))
      if (hasNewReason || diversified.length < limit * 0.7) {
        diversified.push(score)
        score.reasons.forEach(reason => usedReasons.add(reason))
      }
    }

    // Fill remaining slots with highest scores
    for (const score of scores) {
      if (diversified.length >= limit) break
      if (!diversified.includes(score)) {
        diversified.push(score)
      }
    }

    return diversified
  }

  // Helper methods
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        posts: {
          select: {
            hashtags: true,
            createdAt: true,
            likesCount: true
          },
          take: 20,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    })

    if (!user) return null

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      specialties: user.specialties || [],
      location: user.location || undefined,
      bio: user.bio || undefined,
      posts: user.posts,
      followers: user._count.followers,
      following: user._count.following
    }
  }

  private async getCandidateUsers(userId: string): Promise<UserProfile[]> {
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        status: 'ACTIVE'
      },
      include: {
        posts: {
          select: {
            hashtags: true,
            createdAt: true,
            likesCount: true
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      },
      take: 200 // Limit candidates for performance
    })

    return users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      specialties: user.specialties || [],
      location: user.location || undefined,
      bio: user.bio || undefined,
      posts: user.posts,
      followers: user._count.followers,
      following: user._count.following
    }))
  }

  private extractUserHashtags(user: UserProfile): string[] {
    return [...new Set(user.posts.flatMap(post => post.hashtags))]
  }

  private calculateWeightedHashtagSimilarity(user1: UserProfile, user2: UserProfile): number {
    const user1Tags = user1.posts.flatMap(post => post.hashtags)
    const user2Tags = user2.posts.flatMap(post => post.hashtags)

    const user1Freq = this.getHashtagFrequency(user1Tags)
    const user2Freq = this.getHashtagFrequency(user2Tags)

    let totalSimilarity = 0
    let maxPossible = 0

    for (const [tag, freq1] of Object.entries(user1Freq)) {
      const freq2 = user2Freq[tag] || 0
      totalSimilarity += Math.min(freq1, freq2)
      maxPossible += Math.max(freq1, freq2)
    }

    return maxPossible > 0 ? totalSimilarity / maxPossible : 0
  }

  private getHashtagFrequency(tags: string[]): Record<string, number> {
    return tags.reduce((freq, tag) => {
      freq[tag] = (freq[tag] || 0) + 1
      return freq
    }, {} as Record<string, number>)
  }

  private areSkillsRelated(skill1: string, skill2: string): boolean {
    // Simple skill relationship mapping - could be enhanced with ML
    const skillRelations: Record<string, string[]> = {
      'photography': ['videography', 'editing', 'visual design'],
      'videography': ['photography', 'editing', 'motion graphics'],
      'web design': ['development', 'ui/ux', 'frontend'],
      'marketing': ['content creation', 'social media', 'branding'],
      'music': ['audio production', 'sound design', 'mixing']
    }

    return skillRelations[skill1]?.includes(skill2) || 
           skillRelations[skill2]?.includes(skill1) ||
           skill1.includes(skill2) || 
           skill2.includes(skill1)
  }

  private calculateComplementarySkills(skills1: string[], skills2: string[]): number {
    let complementaryCount = 0
    for (const skill1 of skills1) {
      for (const skill2 of skills2) {
        if (this.areSkillsRelated(skill1, skill2)) {
          complementaryCount++
        }
      }
    }
    return Math.min(complementaryCount / Math.max(skills1.length, skills2.length), 1)
  }
}

/**
 * Get AI-powered post recommendations
 */
export async function getAIRecommendedPosts(
  userId: string, 
  options: {
    limit?: number
    includeFollowing?: boolean
    diversify?: boolean
    boostTrending?: boolean
  } = {}
): Promise<any[]> {
  const {
    limit = 20,
    includeFollowing = true,
    diversify = true,
    boostTrending = true
  } = options

  const engine = AIRecommendationEngine.getInstance()
  const userRecommendations = await engine.getAIRecommendations({
    userId,
    limit: Math.min(limit * 2, 40), // Get more users to find diverse posts
    diversify: true
  })

  const recommendedUserIds = userRecommendations.map(rec => rec.userId)

  // Get user's interaction history for better filtering
  const userInteractions = await prisma.userInteraction.findMany({
    where: { userId },
    select: { targetUserId: true, interactionType: true },
    take: 100,
    orderBy: { createdAt: 'desc' }
  })

  const interactedUserIds = [...new Set(userInteractions.map(i => i.targetUserId))]

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      authorId: { not: userId }, // Don't show user's own posts
      OR: [
        // Posts from AI-recommended users
        { authorId: { in: recommendedUserIds } },
        // Posts from users they've interacted with
        includeFollowing ? { authorId: { in: interactedUserIds } } : {},
        // Trending posts (high engagement)
        boostTrending ? {
          AND: [
            { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Last week
            { likesCount: { gte: 10 } } // Minimum engagement
          ]
        } : {}
      ].filter(condition => Object.keys(condition).length > 0)
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
        }
      },
      likes: userId ? {
        where: { userId }
      } : false,
      _count: {
        select: {
          likes: true,
          comments: true
        }
      }
    },
    orderBy: [
      { createdAt: 'desc' },
      { likesCount: 'desc' }
    ],
    take: limit * 3 // Get more to allow for diversification
  })

  // Apply AI-based ranking and diversification
  const rankedPosts = diversify ? 
    diversifyPostRecommendations(posts, userRecommendations, limit) :
    posts.slice(0, limit)

  return rankedPosts.map(post => ({
    ...post,
    liked: userId ? post.likes.length > 0 : false,
    likesCount: post._count.likes,
    commentsCount: post._count.comments
  }))
}

/**
 * Diversify post recommendations to avoid echo chambers
 */
function diversifyPostRecommendations(posts: any[], userRecommendations: RecommendationScore[], limit: number): any[] {
  const diversified: any[] = []
  const usedHashtags = new Set<string>()
  const usedAuthors = new Set<string>()

  // Create a map of user scores for quick lookup
  const userScoreMap = new Map(userRecommendations.map(rec => [rec.userId, rec.score]))

  // Sort posts by a combination of AI score and diversity factors
  const scoredPosts = posts.map(post => ({
    ...post,
    aiScore: userScoreMap.get(post.authorId) || 0,
    diversityScore: calculatePostDiversityScore(post, usedHashtags, usedAuthors)
  }))

  scoredPosts.sort((a, b) => {
    const scoreA = a.aiScore * 0.7 + a.diversityScore * 0.3
    const scoreB = b.aiScore * 0.7 + b.diversityScore * 0.3
    return scoreB - scoreA
  })

  // Select diverse posts
  for (const post of scoredPosts) {
    if (diversified.length >= limit) break

    const hasNewHashtags = post.hashtags.some((tag: string) => !usedHashtags.has(tag))
    const isNewAuthor = !usedAuthors.has(post.authorId)

    if (hasNewHashtags || isNewAuthor || diversified.length < limit * 0.8) {
      diversified.push(post)
      post.hashtags.forEach((tag: string) => usedHashtags.add(tag))
      usedAuthors.add(post.authorId)
    }
  }

  return diversified
}

function calculatePostDiversityScore(post: any, usedHashtags: Set<string>, usedAuthors: Set<string>): number {
  let score = 0
  
  // Boost for new hashtags
  const newHashtags = post.hashtags.filter((tag: string) => !usedHashtags.has(tag))
  score += newHashtags.length * 0.3

  // Boost for new authors
  if (!usedAuthors.has(post.authorId)) {
    score += 0.5
  }

  // Boost for engagement
  score += Math.min(post.likesCount / 50, 0.2)

  return score
}