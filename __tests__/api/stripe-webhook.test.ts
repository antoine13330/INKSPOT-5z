import { POST } from "@/app/api/stripe/webhook/route"
import { NextRequest } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import jest from "jest"

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

const mockStripe = stripe as jest.Mocked<typeof stripe>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe("/api/stripe/webhook", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("handles payment_intent.succeeded event", async () => {
    const mockEvent = {
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_test123",
          amount: 2500, // $25.00 in cents
          currency: "eur",
        },
      },
    }

    const mockPayment = {
      id: "payment1",
      amount: 25,
      booking: {
        id: "booking1",
        title: "Test Service",
        depositAmount: 25,
        clientId: "client1",
        proId: "pro1",
      },
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
    mockPrisma.payment.update.mockResolvedValue(mockPayment)
    mockPrisma.booking.update.mockResolvedValue({})
    mockPrisma.notification.create.mockResolvedValue({})
    mockPrisma.transaction.create.mockResolvedValue({})

    const request = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_test123" },
      data: { status: "COMPLETED" },
      include: expect.any(Object),
    })
    expect(mockPrisma.booking.update).toHaveBeenCalled()
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2)
    expect(mockPrisma.transaction.create).toHaveBeenCalled()
  })

  it("handles payment_intent.payment_failed event", async () => {
    const mockEvent = {
      type: "payment_intent.payment_failed",
      data: {
        object: {
          id: "pi_test123",
        },
      },
    }

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)
    mockPrisma.payment.update.mockResolvedValue({})

    const request = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify(mockEvent),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
    expect(mockPrisma.payment.update).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_test123" },
      data: { status: "FAILED" },
    })
  })

  it("returns 400 for invalid signature", async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature")
    })

    const request = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
