import { NextRequest } from 'next/server'

// Mock @/lib/stripe with explicit webhooks mock
jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
  createPaymentIntent: jest.fn(),
  refundPayment: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    payment: {
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    appointment: {
      update: jest.fn(),
    },
    booking: {
      update: jest.fn(),
      findUnique: jest.fn(),
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

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}))

import { POST } from '@/app/api/stripe/webhook/route'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'

function makeRequest(body = '{}') {
  const req = new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': 'test-sig', 'content-type': 'text/plain' },
  })
  // The setup mocks NextRequest but it lacks text() — add it manually
  ;(req as any).text = jest.fn().mockResolvedValue(body)
  return req
}

describe('/api/stripe/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset default: headers() returns a Map-like object with 'test-signature'
    ;(headers as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue('test-signature'),
    })
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    ;(headers as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue(null),
    })
    const req = makeRequest()
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when signature verification fails', async () => {
    ;(stripe!.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('Webhook signature verification failed')
    })
    const req = makeRequest()
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 for payment_intent.succeeded event', async () => {
    ;(stripe!.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1', metadata: {}, amount: 5000 } },
    })
    const { prisma } = jest.requireMock('@/lib/prisma')
    prisma.payment.updateMany.mockResolvedValue({ count: 1 })
    const req = makeRequest()
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.received).toBe(true)
  })

  it('returns 200 for payment_intent.payment_failed event', async () => {
    ;(stripe!.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_2', metadata: {}, last_payment_error: null } },
    })
    const { prisma } = jest.requireMock('@/lib/prisma')
    prisma.payment.updateMany.mockResolvedValue({ count: 1 })
    const req = makeRequest()
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('returns 200 for checkout.session.completed event', async () => {
    ;(stripe!.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_1', metadata: {}, payment_intent: 'pi_1' } },
    })
    const { prisma } = jest.requireMock('@/lib/prisma')
    prisma.payment.updateMany.mockResolvedValue({ count: 1 })
    const req = makeRequest()
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('returns 200 for unknown event type (handled gracefully)', async () => {
    ;(stripe!.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'charge.dispute.created',
      data: { object: {} },
    })
    const req = makeRequest()
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('returns 200 for charge.refunded event', async () => {
    ;(stripe!.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'charge.refunded',
      data: { object: { id: 'ch_1', payment_intent: 'pi_1', amount_refunded: 1000 } },
    })
    const { prisma } = jest.requireMock('@/lib/prisma')
    prisma.payment.updateMany.mockResolvedValue({ count: 1 })
    const req = makeRequest()
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})
