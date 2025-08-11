// Mock dependencies
jest.mock("next-auth")
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))

// Mock API handler
const mockPATCH = jest.fn()

describe("/api/admin/users/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("PATCH", () => {
    it("suspends user successfully", async () => {
      const mockUser = {
        id: "user1",
        username: "testuser",
        status: "SUSPENDED",
      }

      mockPATCH.mockResolvedValue({
        status: 200,
        json: async () => ({
          message: "User suspended successfully",
          user: mockUser,
        }),
      })

      const response = await mockPATCH()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe("User suspended successfully")
      expect(data.user.status).toBe("SUSPENDED")
    })

    it("returns 403 for non-admin user", async () => {
      mockPATCH.mockResolvedValue({
        status: 403,
        json: async () => ({
          message: "Forbidden",
        }),
      })

      const response = await mockPATCH()
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.message).toBe("Forbidden")
    })

    it("verifies user successfully", async () => {
      const mockUser = {
        id: "user1",
        username: "testuser",
        verified: true,
      }

      mockPATCH.mockResolvedValue({
        status: 200,
        json: async () => ({
          message: "User verified successfully",
          user: mockUser,
        }),
      })

      const response = await mockPATCH()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe("User verified successfully")
      expect(data.user.verified).toBe(true)
    })

    it("returns 401 for unauthenticated users", async () => {
      mockPATCH.mockResolvedValue({
        status: 401,
        json: async () => ({
          message: "Unauthorized",
        }),
      })

      const response = await mockPATCH()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe("Unauthorized")
    })

    it("handles invalid actions gracefully", async () => {
      mockPATCH.mockResolvedValue({
        status: 400,
        json: async () => ({
          message: "Invalid action",
        }),
      })

      const response = await mockPATCH()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe("Invalid action")
    })

    it("handles database errors gracefully", async () => {
      mockPATCH.mockResolvedValue({
        status: 500,
        json: async () => ({
          message: "Internal server error",
        }),
      })

      const response = await mockPATCH()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.message).toBe("Internal server error")
    })
  })
})
