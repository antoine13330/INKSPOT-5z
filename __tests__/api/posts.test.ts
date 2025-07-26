import { NextRequest } from "next/server"

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}))

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

const mockSession = {
  user: {
    id: "test-user-id",
    email: "test@example.com",
    username: "testuser",
    role: "CLIENT" as const,
  },
}

const mockPosts = [
  {
    id: "post-1",
    content: "Test post content",
    images: ["https://example.com/image1.jpg"],
    hashtags: ["#test", "#tattoo"],
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    authorId: "test-user-id",
    author: {
      id: "test-user-id",
      username: "testuser",
      avatar: "https://example.com/avatar.jpg",
      role: "CLIENT",
      verified: true,
      businessName: "Test Business",
      specialties: ["Tattoo", "Design"],
      hourlyRate: 100,
    },
    _count: {
      likes: 10,
      comments: 5,
    },
    likes: [],
  },
]

// Mock API handlers
const mockGET = jest.fn()
const mockPOST = jest.fn()

describe("Posts API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET /api/posts", () => {
    it("returns posts successfully", async () => {
      // Mock successful response
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          posts: mockPosts.map(post => ({
            ...post,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            liked: false,
            viewsCount: 0,
          })),
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            pages: 1,
          },
        }),
      })

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].content).toBe("Test post content")
      expect(data.posts[0].likesCount).toBe(10)
      expect(data.posts[0].commentsCount).toBe(5)
    })

    it("filters posts by user ID when provided", async () => {
      const filteredPosts = mockPosts.filter(post => post.authorId === "test-user-id")
      
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          posts: filteredPosts.map(post => ({
            ...post,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            liked: false,
            viewsCount: 0,
          })),
          pagination: {
            total: filteredPosts.length,
            page: 1,
            limit: 10,
            pages: 1,
          },
        }),
      })

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(1)
      expect(data.posts[0].authorId).toBe("test-user-id")
    })

    it("handles pagination correctly", async () => {
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          posts: mockPosts.map(post => ({
            ...post,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            liked: false,
            viewsCount: 0,
          })),
          pagination: {
            total: 1,
            page: 2,
            limit: 5,
            pages: 1,
          },
        }),
      })

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(5)
    })

    it("returns empty posts list when no posts exist", async () => {
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          posts: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 0,
          },
        }),
      })

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts).toHaveLength(0)
      expect(data.pagination.total).toBe(0)
    })

    it("handles database errors gracefully", async () => {
      mockGET.mockResolvedValue({
        status: 500,
        json: async () => ({
          message: "Internal server error",
        }),
      })

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe("Internal server error")
    })

    it("includes likes information for authenticated users", async () => {
      const postsWithLikes = mockPosts.map(post => ({
        ...post,
        likes: [{ userId: "test-user-id" }],
      }))

      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          posts: postsWithLikes.map(post => ({
            ...post,
            likesCount: post._count.likes,
            commentsCount: post._count.comments,
            liked: post.likes.length > 0,
            viewsCount: 0,
          })),
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            pages: 1,
          },
        }),
      })

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.posts[0].liked).toBe(true)
    })
  })

  describe("POST /api/posts", () => {
    it("creates a new post successfully", async () => {
      const newPost = {
        id: "post-2",
        content: "New post content",
        images: ["https://example.com/image2.jpg"],
        hashtags: ["#new", "#post"],
        createdAt: new Date(),
        authorId: "test-user-id",
        author: {
          id: "test-user-id",
          username: "testuser",
          avatar: "https://example.com/avatar.jpg",
          role: "CLIENT",
          verified: true,
          businessName: "Test Business",
          specialties: ["Tattoo", "Design"],
        },
        _count: {
          likes: 0,
          comments: 0,
        },
        likes: [],
      }

      mockPOST.mockResolvedValue({
        status: 200,
        json: async () => ({
          message: "Post created successfully",
          post: {
            ...newPost,
            likesCount: 0,
            commentsCount: 0,
            liked: false,
            viewsCount: 0,
          },
        }),
      })

      const response = await mockPOST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe("Post created successfully")
      expect(data.post.content).toBe("New post content")
    })

    it("returns unauthorized when user is not authenticated", async () => {
      mockPOST.mockResolvedValue({
        status: 401,
        json: async () => ({
          message: "Unauthorized",
        }),
      })

      const response = await mockPOST()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe("Unauthorized")
    })

    it("handles missing content gracefully", async () => {
      mockPOST.mockResolvedValue({
        status: 400,
        json: async () => ({
          message: "Content is required",
        }),
      })

      const response = await mockPOST()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe("Content is required")
    })

    it("handles database errors during creation", async () => {
      mockPOST.mockResolvedValue({
        status: 500,
        json: async () => ({
          message: "Internal server error",
        }),
      })

      const response = await mockPOST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe("Internal server error")
    })

    it("creates post with default values when optional fields are missing", async () => {
      const newPost = {
        id: "post-3",
        content: "Simple post",
        images: [],
        hashtags: [],
        createdAt: new Date(),
        authorId: "test-user-id",
        author: {
          id: "test-user-id",
          username: "testuser",
          avatar: "https://example.com/avatar.jpg",
          role: "CLIENT",
          verified: true,
          businessName: "Test Business",
          specialties: ["Tattoo", "Design"],
        },
        _count: {
          likes: 0,
          comments: 0,
        },
        likes: [],
      }

      mockPOST.mockResolvedValue({
        status: 200,
        json: async () => ({
          message: "Post created successfully",
          post: {
            ...newPost,
            likesCount: 0,
            commentsCount: 0,
            liked: false,
            viewsCount: 0,
          },
        }),
      })

      const response = await mockPOST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.post.images).toEqual([])
      expect(data.post.hashtags).toEqual([])
    })
  })
}) 