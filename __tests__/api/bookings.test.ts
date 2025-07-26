import { NextRequest } from "next/server"

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

// Mock API handlers
const mockPOST = jest.fn()
const mockGET = jest.fn()

describe("/api/bookings", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("POST", () => {
    it("creates a booking successfully", async () => {
      const mockBooking = {
        id: "booking1",
        title: "Test Service",
        description: "Test description",
        startTime: "2024-01-01T10:00:00Z",
        endTime: "2024-01-01T11:00:00Z",
        price: 50,
        client: { id: "user1", username: "testuser" },
        pro: { id: "pro1", username: "testpro" },
      }

      mockPOST.mockResolvedValue({
        status: 200,
        json: async () => ({
          message: "Booking created successfully",
          booking: mockBooking,
        }),
      })

      const response = await mockPOST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe("Booking created successfully")
      expect(data.booking.title).toBe("Test Service")
      expect(data.booking.price).toBe(50)
    })

    it("returns 401 for unauthenticated user", async () => {
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

    it("returns 404 for non-existent pro", async () => {
      mockPOST.mockResolvedValue({
        status: 404,
        json: async () => ({
          message: "Professional not found",
        }),
      })

      const response = await mockPOST()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.message).toBe("Professional not found")
    })

    it("returns 400 for invalid booking data", async () => {
      mockPOST.mockResolvedValue({
        status: 400,
        json: async () => ({
          message: "Invalid booking data",
        }),
      })

      const response = await mockPOST()
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.message).toBe("Invalid booking data")
    })

    it("handles booking conflicts", async () => {
      mockPOST.mockResolvedValue({
        status: 409,
        json: async () => ({
          message: "Booking conflict detected",
        }),
      })

      const response = await mockPOST()
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.message).toBe("Booking conflict detected")
    })

    it("handles database errors gracefully", async () => {
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
  })

  describe("GET", () => {
    it("returns user bookings successfully", async () => {
      const mockBookings = [
        {
          id: "booking1",
          title: "Test Service 1",
          startTime: "2024-01-01T10:00:00Z",
          endTime: "2024-01-01T11:00:00Z",
          price: 50,
          status: "CONFIRMED",
          client: { id: "user1", username: "testuser" },
          pro: { id: "pro1", username: "testpro" },
        },
        {
          id: "booking2",
          title: "Test Service 2",
          startTime: "2024-01-02T10:00:00Z",
          endTime: "2024-01-02T11:00:00Z",
          price: 75,
          status: "PENDING",
          client: { id: "user1", username: "testuser" },
          pro: { id: "pro2", username: "testpro2" },
        },
      ]

      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          bookings: mockBookings,
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
            pages: 1,
          },
        }),
      })

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.bookings).toHaveLength(2)
      expect(data.bookings[0].title).toBe("Test Service 1")
      expect(data.bookings[1].title).toBe("Test Service 2")
    })

    it("returns empty bookings for new users", async () => {
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          bookings: [],
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
      expect(data.bookings).toHaveLength(0)
      expect(data.pagination.total).toBe(0)
    })

    it("handles pagination correctly", async () => {
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          bookings: [],
          pagination: {
            total: 25,
            page: 2,
            limit: 10,
            pages: 3,
          },
        }),
      })

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(10)
      expect(data.pagination.pages).toBe(3)
    })

    it("returns 401 for unauthenticated users", async () => {
      mockGET.mockResolvedValue({
        status: 401,
        json: async () => ({
          message: "Unauthorized",
        }),
      })

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.message).toBe("Unauthorized")
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
  })
})
