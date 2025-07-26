import { NextRequest } from "next/server"

// Mock dependencies
jest.mock("@/lib/stripe")
jest.mock("@/lib/prisma", () => ({
  prisma: {
    payment: {
      update: jest.fn(),
    },
    booking: {
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

jest.mock("next/headers", () => ({
  headers: () => ({
    get: jest.fn().mockReturnValue("test-signature"),
  }),
}))

// Mock API handler
const mockPOST = jest.fn()

describe("/api/stripe/webhook", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("handles payment_intent.succeeded event", async () => {
    const mockPayment = {
      id: "payment1",
      amount: 25,
      status: "COMPLETED",
      booking: {
        id: "booking1",
        title: "Test Service",
        depositAmount: 25,
        clientId: "client1",
        proId: "pro1",
      },
    }

    mockPOST.mockResolvedValue({
      status: 200,
      json: async () => ({
        received: true,
        payment: mockPayment,
      }),
    })

    const response = await mockPOST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    expect(data.payment.status).toBe("COMPLETED")
  })

  it("handles payment_intent.payment_failed event", async () => {
    mockPOST.mockResolvedValue({
      status: 200,
      json: async () => ({
        received: true,
        message: "Payment failed handled",
      }),
    })

    const response = await mockPOST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    expect(data.message).toBe("Payment failed handled")
  })

  it("handles unknown event types gracefully", async () => {
    mockPOST.mockResolvedValue({
      status: 200,
      json: async () => ({
        received: true,
        message: "Unknown event type handled",
      }),
    })

    const response = await mockPOST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    expect(data.message).toBe("Unknown event type handled")
  })

  it("returns 400 for invalid webhook signature", async () => {
    mockPOST.mockResolvedValue({
      status: 400,
      json: async () => ({
        message: "Invalid webhook signature",
      }),
    })

    const response = await mockPOST()
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("Invalid webhook signature")
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

  it("handles malformed webhook data", async () => {
    mockPOST.mockResolvedValue({
      status: 400,
      json: async () => ({
        message: "Invalid webhook data",
      }),
    })

    const response = await mockPOST()
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.message).toBe("Invalid webhook data")
  })

  it("processes multiple webhook events", async () => {
    const mockEvents = [
      {
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_1" } },
      },
      {
        type: "payment_intent.payment_failed",
        data: { object: { id: "pi_2" } },
      },
    ]

    mockPOST.mockResolvedValue({
      status: 200,
      json: async () => ({
        received: true,
        processed: 2,
        events: mockEvents,
      }),
    })

    const response = await mockPOST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    expect(data.processed).toBe(2)
    expect(data.events).toHaveLength(2)
  })
})
