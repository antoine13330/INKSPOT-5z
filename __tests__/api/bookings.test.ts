import { NextRequest } from 'next/server'

// Mock all dependencies before importing the route
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({})),
}))

jest.mock('next-auth/providers/credentials', () =>
  jest.fn(() => ({ id: 'credentials', type: 'credentials' }))
)

jest.mock('next-auth/providers/google', () =>
  jest.fn(() => ({ id: 'google', type: 'oauth' }))
)

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/stripe', () => ({
  stripe: { paymentIntents: { create: jest.fn() } },
  createPaymentIntent: jest.fn(),
  refundPayment: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
  sendBookingConfirmationEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/offline-push-notifications', () => ({
  notifyOfflineUserForProposal: jest.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/bookings/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { createPaymentIntent } from '@/lib/stripe'

function makePostRequest(body: object) {
  const req = new NextRequest('http://localhost/api/bookings', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
  return req
}

describe('/api/bookings POST', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const req = makePostRequest({ proId: 'p1', title: 'Test' })
    const res = await POST(req)
    expect(res.status).toBe(401)
    const data = await res.json()
    expect(data.message).toBe('Unauthorized')
  })

  it('returns 403 when user is not PRO', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'CLIENT' },
    })
    const req = makePostRequest({ proId: 'p1', title: 'Test' })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 404 when pro is not found', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'u1', role: 'PRO' },
    })
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
    const req = makePostRequest({
      proId: 'nonexistent',
      title: 'Test',
      description: 'Desc',
      startTime: '2026-04-01T10:00:00Z',
      endTime: '2026-04-01T11:00:00Z',
      price: 50,
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data.message).toBe('Professional not found')
  })

  it('returns 400 when time slot is not available (conflict)', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'pro1', role: 'PRO' },
    })
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'pro1', role: 'PRO' })
    ;(prisma.booking.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' })
    const req = makePostRequest({
      proId: 'pro1',
      title: 'Test Service',
      description: 'Desc',
      startTime: '2026-04-01T10:00:00Z',
      endTime: '2026-04-01T11:00:00Z',
      price: 50,
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.message).toBe('Time slot is not available')
  })

  it('creates a booking successfully when all conditions are met', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'client1', role: 'PRO' },
    })
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'pro1', role: 'PRO' })
    ;(prisma.booking.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'client1',
      username: 'client',
      email: 'client@test.com',
    })
    ;(createPaymentIntent as jest.Mock).mockResolvedValue({
      paymentIntentId: 'pi_test_123',
      clientSecret: 'cs_test_secret',
    })
    ;(prisma.booking.create as jest.Mock).mockResolvedValue({
      id: 'b1',
      title: 'Test Service',
      price: 50,
      status: 'PENDING',
      client: { id: 'client1', username: 'client', email: 'client@test.com' },
      pro: { id: 'pro1', username: 'pro', email: 'pro@test.com' },
    })
    ;(prisma.payment.create as jest.Mock).mockResolvedValue({ id: 'pay1' })
    ;(prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif1' })
    const req = makePostRequest({
      proId: 'pro1',
      title: 'Test Service',
      description: 'Desc',
      startTime: '2026-04-01T10:00:00Z',
      endTime: '2026-04-01T11:00:00Z',
      price: 50,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.booking).toBeDefined()
  })
})
