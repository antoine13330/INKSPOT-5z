import { PATCH } from "@/app/api/admin/users/[id]/route"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import jest from "jest"

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

const mockGetServerSession = getServerSession as jest.Mock
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe("/api/admin/users/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("PATCH", () => {
    it("suspends user successfully", async () => {
      const mockAdminSession = {
        user: { id: "admin1", role: "ADMIN" },
      }

      const mockUser = {
        id: "user1",
        username: "testuser",
        status: "SUSPENDED",
      }

      mockGetServerSession.mockResolvedValue(mockAdminSession)
      mockPrisma.user.update.mockResolvedValue(mockUser)

      const request = new NextRequest("http://localhost/api/admin/users/user1", {
        method: "PATCH",
        body: JSON.stringify({ action: "suspend" }),
      })

      const response = await PATCH(request, { params: { id: "user1" } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: { status: "SUSPENDED" },
      })
    })

    it("returns 403 for non-admin user", async () => {
      const mockUserSession = {
        user: { id: "user1", role: "CLIENT" },
      }

      mockGetServerSession.mockResolvedValue(mockUserSession)

      const request = new NextRequest("http://localhost/api/admin/users/user1", {
        method: "PATCH",
        body: JSON.stringify({ action: "suspend" }),
      })

      const response = await PATCH(request, { params: { id: "user1" } })
      expect(response.status).toBe(403)
    })

    it("verifies user successfully", async () => {
      const mockAdminSession = {
        user: { id: "admin1", role: "ADMIN" },
      }

      const mockUser = {
        id: "user1",
        username: "testuser",
        verified: true,
      }

      mockGetServerSession.mockResolvedValue(mockAdminSession)
      mockPrisma.user.update.mockResolvedValue(mockUser)

      const request = new NextRequest("http://localhost/api/admin/users/user1", {
        method: "PATCH",
        body: JSON.stringify({ action: "verify" }),
      })

      const response = await PATCH(request, { params: { id: "user1" } })

      expect(response.status).toBe(200)
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: { verified: true },
      })
    })
  })
})
