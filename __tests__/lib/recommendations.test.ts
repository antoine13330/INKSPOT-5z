import { calculateRecommendationScore, getRecommendedPosts, recordUserInteraction } from "@/lib/recommendations"
import { prisma } from "@/lib/prisma"
import jest from "jest"

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

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe("Recommendations", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("calculateRecommendationScore", () => {
    it("calculates scores based on interactions and hashtags", async () => {
      const mockInteractions = [
        {
          targetUserId: "user1",
          interactionType: "like",
          weight: 2,
          createdAt: new Date(),
          targetUser: {
            id: "user1",
            username: "testuser1",
            role: "PRO",
            specialties: ["tattoo", "art"],
            posts: [{ hashtags: ["#tattoo", "#art"] }, { hashtags: ["#design"] }],
          },
        },
      ]

      const mockSearchHistory = [
        {
          hashtags: ["#tattoo", "#art"],
          createdAt: new Date(),
        },
      ]

      mockPrisma.userInteraction.findMany.mockResolvedValue(mockInteractions)
      mockPrisma.searchHistory.findMany.mockResolvedValue(mockSearchHistory)

      const scores = await calculateRecommendationScore("currentUser")

      expect(scores).toHaveLength(1)
      expect(scores[0].userId).toBe("user1")
      expect(scores[0].score).toBeGreaterThan(0)
      expect(scores[0].commonHashtags).toContain("#tattoo")
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
        },
      ]

      // Mock the recommendation calculation
      mockPrisma.userInteraction.findMany.mockResolvedValue([])
      mockPrisma.searchHistory.findMany.mockResolvedValue([{ hashtags: ["#tattoo"], createdAt: new Date() }])
      mockPrisma.post.findMany.mockResolvedValue(mockPosts)

      const posts = await getRecommendedPosts("userId", 10)

      expect(posts).toHaveLength(1)
      expect(posts[0].id).toBe("post1")
      expect(posts[0].liked).toBe(false)
      expect(posts[0].likesCount).toBe(5)
    })
  })

  describe("recordUserInteraction", () => {
    it("records interaction and updates profile views", async () => {
      mockPrisma.userInteraction.create.mockResolvedValue({})
      mockPrisma.user.update.mockResolvedValue({})

      await recordUserInteraction("user1", "user2", "view", 1)

      expect(mockPrisma.userInteraction.create).toHaveBeenCalledWith({
        data: {
          userId: "user1",
          targetUserId: "user2",
          interactionType: "view",
          weight: 1,
        },
      })

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user2" },
        data: {
          profileViews: {
            increment: 1,
          },
        },
      })
    })

    it("does not record self-interactions", async () => {
      await recordUserInteraction("user1", "user1", "view", 1)

      expect(mockPrisma.userInteraction.create).not.toHaveBeenCalled()
    })
  })
})
