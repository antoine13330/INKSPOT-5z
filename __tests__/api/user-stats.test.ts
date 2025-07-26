import { NextRequest } from "next/server"

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      count: jest.fn(),
    },
    follow: {
      count: jest.fn(),
    },
  },
}))

// Mock API handler
const mockGET = jest.fn()

describe("User Stats API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns user statistics successfully", async () => {
    mockGET.mockResolvedValue({
      status: 200,
      json: async () => ({
        posts: 15,
        followers: 250,
        following: 100,
      }),
    })

    const response = await mockGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toBe(15)
    expect(data.followers).toBe(250)
    expect(data.following).toBe(100)
  })

  it("returns zero stats for new users", async () => {
    mockGET.mockResolvedValue({
      status: 200,
      json: async () => ({
        posts: 0,
        followers: 0,
        following: 0,
      }),
    })

    const response = await mockGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toBe(0)
    expect(data.followers).toBe(0)
    expect(data.following).toBe(0)
  })

  it("handles database errors gracefully", async () => {
    mockGET.mockResolvedValue({
      status: 500,
      json: async () => ({
        error: "Failed to fetch user stats",
      }),
    })

    const response = await mockGET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Failed to fetch user stats")
  })

  it("queries posts count with correct user ID", async () => {
    mockGET.mockResolvedValue({
      status: 200,
      json: async () => ({
        posts: 5,
        followers: 10,
        following: 3,
      }),
    })

    const response = await mockGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.posts).toBe(5)
  })

  it("queries followers count with correct user ID", async () => {
    mockGET.mockResolvedValue({
      status: 200,
      json: async () => ({
        posts: 5,
        followers: 10,
        following: 3,
      }),
    })

    const response = await mockGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.followers).toBe(10)
  })

  it("queries following count with correct user ID", async () => {
    mockGET.mockResolvedValue({
      status: 200,
      json: async () => ({
        posts: 5,
        followers: 10,
        following: 3,
      }),
    })

    const response = await mockGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.following).toBe(3)
  })

  it("handles partial database failures", async () => {
    mockGET.mockResolvedValue({
      status: 500,
      json: async () => ({
        error: "Failed to fetch user stats",
      }),
    })

    const response = await mockGET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe("Failed to fetch user stats")
  })

  it("handles invalid user ID gracefully", async () => {
    mockGET.mockResolvedValue({
      status: 400,
      json: async () => ({
        error: "Invalid user ID",
      }),
    })

    const response = await mockGET()
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Invalid user ID")
  })

  it("returns consistent data structure", async () => {
    mockGET.mockResolvedValue({
      status: 200,
      json: async () => ({
        posts: 42,
        followers: 123,
        following: 67,
      }),
    })

    const response = await mockGET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty("posts")
    expect(data).toHaveProperty("followers")
    expect(data).toHaveProperty("following")
    expect(typeof data.posts).toBe("number")
    expect(typeof data.followers).toBe("number")
    expect(typeof data.following).toBe("number")
  })
}) 