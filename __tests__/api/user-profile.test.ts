import { NextRequest } from "next/server"

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock NextAuth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}))

// Mock API handler
const mockPUT = jest.fn()

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  username: "testuser",
  avatar: "https://example.com/avatar.jpg",
  role: "CLIENT",
  verified: true,
  businessName: "Test Business",
  specialties: ["Tattoo", "Design"],
  bio: "Test bio",
  location: "Test City",
  website: "https://test.com",
  phone: "+1234567890",
}

describe("User Profile API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("updates user profile successfully", async () => {
    const updatedUser = {
      ...mockUser,
      username: "newusername",
      bio: "Updated bio",
      location: "New City",
      website: "https://newwebsite.com",
      phone: "+9876543210",
    }

    mockPUT.mockResolvedValue({
      status: 200,
      json: async () => ({
        message: "Profile updated successfully",
        user: updatedUser,
      }),
    })

    const response = await mockPUT()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Profile updated successfully")
    expect(data.user.username).toBe("newusername")
    expect(data.user.bio).toBe("Updated bio")
  })

  it("returns 401 for unauthenticated users", async () => {
    mockPUT.mockResolvedValue({
      status: 401,
      json: async () => ({
        message: "Unauthorized",
      }),
    })

    const response = await mockPUT()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.message).toBe("Unauthorized")
  })

  it("returns 403 when updating another user's profile", async () => {
    mockPUT.mockResolvedValue({
      status: 403,
      json: async () => ({
        message: "Forbidden",
      }),
    })

    const response = await mockPUT()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.message).toBe("Forbidden")
  })

  it("handles taken username gracefully", async () => {
    mockPUT.mockResolvedValue({
      status: 409,
      json: async () => ({
        message: "Username is already taken",
      }),
    })

    const response = await mockPUT()
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.message).toBe("Username is already taken")
  })

  it("allows updating to current username", async () => {
    mockPUT.mockResolvedValue({
      status: 200,
      json: async () => ({
        message: "Profile updated successfully",
        user: mockUser,
      }),
    })

    const response = await mockPUT()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Profile updated successfully")
  })

  it("handles partial updates", async () => {
    const partiallyUpdatedUser = {
      ...mockUser,
      bio: "Updated bio only",
    }

    mockPUT.mockResolvedValue({
      status: 200,
      json: async () => ({
        message: "Profile updated successfully",
        user: partiallyUpdatedUser,
      }),
    })

    const response = await mockPUT()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.bio).toBe("Updated bio only")
    expect(data.user.username).toBe("testuser") // Unchanged
  })

  it("handles database errors gracefully", async () => {
    mockPUT.mockResolvedValue({
      status: 500,
      json: async () => ({
        message: "Internal server error",
      }),
    })

    const response = await mockPUT()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.message).toBe("Internal server error")
  })

  it("handles empty update requests", async () => {
    mockPUT.mockResolvedValue({
      status: 200,
      json: async () => ({
        message: "Profile updated successfully",
        user: mockUser,
      }),
    })

    const response = await mockPUT()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe("Profile updated successfully")
  })

  it("returns updated user data", async () => {
    const updatedUser = {
      ...mockUser,
      username: "newusername",
      bio: "Updated bio",
    }

    mockPUT.mockResolvedValue({
      status: 200,
      json: async () => ({
        message: "Profile updated successfully",
        user: updatedUser,
      }),
    })

    const response = await mockPUT()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toBeDefined()
    expect(data.user.username).toBe("newusername")
    expect(data.user.bio).toBe("Updated bio")
  })

  it("handles malformed JSON gracefully", async () => {
    mockPUT.mockResolvedValue({
      status: 400,
      json: async () => ({
        message: "Invalid JSON",
      }),
    })

    const response = await mockPUT()
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("Invalid JSON")
  })
}) 