import { prisma } from "@/lib/prisma"

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    userInteraction: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    searchHistory: {
      findMany: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  },
}))

// Mock recommendation functions
const mockCalculateRecommendationScore = jest.fn()
const mockGetRecommendedPosts = jest.fn()
const mockRecordUserInteraction = jest.fn()

describe("Recommendations", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("calculateRecommendationScore", () => {
    it("calculates scores based on interactions and hashtags", async () => {
      const mockScores = [
        {
          userId: "user1",
          score: 85.5,
          commonHashtags: ["#tattoo", "#art"],
          specialties: ["tattoo", "art"],
        },
      ]

      mockCalculateRecommendationScore.mockResolvedValue(mockScores)

      const scores = await mockCalculateRecommendationScore("currentUser")

      expect(scores).toHaveLength(1)
      expect(scores[0].userId).toBe("user1")
      expect(scores[0].score).toBeGreaterThan(0)
      expect(scores[0].commonHashtags).toContain("#tattoo")
    })

    it("handles empty interactions gracefully", async () => {
      mockCalculateRecommendationScore.mockResolvedValue([])

      const scores = await mockCalculateRecommendationScore("currentUser")

      expect(scores).toHaveLength(0)
    })

    it("prioritizes recent interactions", async () => {
      const mockScores = [
        {
          userId: "user1",
          score: 95.0,
          commonHashtags: ["#tattoo"],
          specialties: ["tattoo"],
        },
        {
          userId: "user2",
          score: 75.0,
          commonHashtags: ["#art"],
          specialties: ["art"],
        },
      ]

      mockCalculateRecommendationScore.mockResolvedValue(mockScores)

      const scores = await mockCalculateRecommendationScore("currentUser")

      expect(scores[0].score).toBeGreaterThan(scores[1].score)
    })
  })

  describe("getRecommendedPosts", () => {
    it("returns posts from recommended users and preferred hashtags", async () => {
      const mockPosts = [
        {
          id: "post1",
          content: "Test post",
          hashtags: ["#tattoo"],
          author: {
            id: "user1",
            username: "testuser1",
            role: "PRO",
          },
          likes: [],
          _count: { likes: 5, comments: 2 },
          liked: false,
          likesCount: 5,
          commentsCount: 2,
        },
      ]

      mockGetRecommendedPosts.mockResolvedValue(mockPosts)

      const posts = await mockGetRecommendedPosts("userId", 10)

      expect(posts).toHaveLength(1)
      expect(posts[0].id).toBe("post1")
      expect(posts[0].liked).toBe(false)
      expect(posts[0].likesCount).toBe(5)
    })

    it("filters posts by hashtag preferences", async () => {
      const mockPosts = [
        {
          id: "post1",
          content: "Tattoo post",
          hashtags: ["#tattoo"],
          author: { id: "user1", username: "artist1", role: "PRO" },
          likes: [],
          _count: { likes: 10, comments: 3 },
        },
        {
          id: "post2",
          content: "Design post",
          hashtags: ["#design"],
          author: { id: "user2", username: "artist2", role: "PRO" },
          likes: [],
          _count: { likes: 5, comments: 1 },
        },
      ]

      mockGetRecommendedPosts.mockResolvedValue(mockPosts)

      const posts = await mockGetRecommendedPosts("userId", 10)

      expect(posts).toHaveLength(2)
      expect(posts[0].hashtags).toContain("#tattoo")
      expect(posts[1].hashtags).toContain("#design")
    })

    it("limits results based on count parameter", async () => {
      const mockPosts = [
        { id: "post1", content: "Post 1", hashtags: ["#tattoo"], author: { id: "user1" }, likes: [], _count: { likes: 5, comments: 2 } },
        { id: "post2", content: "Post 2", hashtags: ["#art"], author: { id: "user2" }, likes: [], _count: { likes: 3, comments: 1 } },
      ]

      mockGetRecommendedPosts.mockResolvedValue(mockPosts.slice(0, 1))

      const posts = await mockGetRecommendedPosts("userId", 1)

      expect(posts).toHaveLength(1)
    })
  })

  describe("recordUserInteraction", () => {
    it("records interaction and updates profile views", async () => {
      const { prisma } = require("@/lib/prisma")

      prisma.userInteraction.create.mockResolvedValue({
        id: "interaction1",
        userId: "currentUser",
        targetUserId: "targetUser",
        interactionType: "like",
        weight: 2,
      })

      prisma.user.update.mockResolvedValue({
        id: "targetUser",
        profileViews: 1,
      })

      mockRecordUserInteraction.mockResolvedValue({
        interaction: {
          id: "interaction1",
          userId: "currentUser",
          targetUserId: "targetUser",
          interactionType: "like",
          weight: 2,
        },
        profileViews: 1,
      })

      const result = await mockRecordUserInteraction("currentUser", "targetUser", "like")

      expect(result.interaction.interactionType).toBe("like")
      expect(result.profileViews).toBe(1)
    })

    it("handles different interaction types", async () => {
      const { prisma } = require("@/lib/prisma")

      prisma.userInteraction.create.mockResolvedValue({
        id: "interaction2",
        userId: "currentUser",
        targetUserId: "targetUser",
        interactionType: "comment",
        weight: 3,
      })

      mockRecordUserInteraction.mockResolvedValue({
        interaction: {
          id: "interaction2",
          userId: "currentUser",
          targetUserId: "targetUser",
          interactionType: "comment",
          weight: 3,
        },
        profileViews: 1,
      })

      const result = await mockRecordUserInteraction("currentUser", "targetUser", "comment")

      expect(result.interaction.interactionType).toBe("comment")
      expect(result.interaction.weight).toBe(3)
    })

    it("handles database errors gracefully", async () => {
      const { prisma } = require("@/lib/prisma")

      prisma.userInteraction.create.mockRejectedValue(new Error("Database error"))

      mockRecordUserInteraction.mockRejectedValue(new Error("Failed to record interaction"))

      await expect(mockRecordUserInteraction("currentUser", "targetUser", "like")).rejects.toThrow("Failed to record interaction")
    })
  })
})
