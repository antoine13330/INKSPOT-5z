import { POST, GET } from "@/app/api/bookings/route"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import jest from "jest" // Import jest to declare the variable

// Mock dependencies
jest.mock("next-auth")
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}))

const mockGetServerSession = getServerSession as jest.Mock
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe("/api/bookings", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("POST", () => {
    it("creates a booking successfully", async () => {
      const mockSession = {
        user: { id: "user1", username: "testuser" },
      }

      const mockPro = {
        id: "pro1",
        role: "PRO",
      }

      const mockBooking = {
        id: "booking1",
        title: "Test Service",
        client: { id: "user1", username: "testuser" },
        pro: { id: "pro1", username: "testpro" },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findFirst.mockResolvedValue(mockPro)
      mockPrisma.booking.findFirst.mockResolvedValue(null) // No conflicts
      mockPrisma.booking.create.mockResolvedValue(mockBooking)
      mockPrisma.notification.create.mockResolvedValue({})

      const request = new NextRequest("http://localhost/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          proId: "pro1",
          title: "Test Service",
          description: "Test description",
          startTime: "2024-01-01T10:00:00Z",
          endTime: "2024-01-01T11:00:00Z",
          price: 50,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.booking.title).toBe("Test Service")
      expect(mockPrisma.booking.create).toHaveBeenCalled()
      expect(mockPrisma.notification.create).toHaveBeenCalled()
    })

    it("returns 401 for unauthenticated user", async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest("http://localhost/api/bookings", {
        method: "POST",
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it("returns 404 for non-existent pro", async () => {
      const mockSession = {
        user: { id: "user1", username: "testuser" },
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findFirst.mockResolvedValue(null)

      const request = new NextRequest("http://localhost/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          proId: "nonexistent",
          title: "Test Service",
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(404)
    })

    it("returns 400 for conflicting booking", async () => {
      const mockSession = {
        user: { id: "user1", username: "testuser" },
      }

      const mockPro = {
        id: "pro1",
        role: "PRO",
      }

      const mockConflictingBooking = {
        id: "existing1",
        startTime: new Date("2024-01-01T10:00:00Z"),
        endTime: new Date("2024-01-01T11:00:00Z"),
      }

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.user.findFirst.mockResolvedValue(mockPro)
      mockPrisma.booking.findFirst.mockResolvedValue(mockConflictingBooking)

      const request = new NextRequest("http://localhost/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          proId: "pro1",
          title: "Test Service",
          startTime: "2024-01-01T10:30:00Z",
          endTime: "2024-01-01T11:30:00Z",
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })
  })

  describe("GET", () => {
    it("fetches user bookings successfully", async () => {
      const mockSession = {
        user: { id: "user1", username: "testuser" },
      }

      const mockBookings = [
        {
          id: "booking1",
          title: "Test Service",
          client: { id: "user1", username: "testuser" },
          pro: { id: "pro1", username: "testpro" },
        },
      ]

      mockGetServerSession.mockResolvedValue(mockSession)
      mockPrisma.booking.findMany.mockResolvedValue(mockBookings)

      const request = new NextRequest("http://localhost/api/bookings")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toHaveLength(1)
      expect(data.bookings[0].title).toBe("Test Service")
    })

    it("returns 401 for unauthenticated user", async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest("http://localhost/api/bookings")
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })
})
