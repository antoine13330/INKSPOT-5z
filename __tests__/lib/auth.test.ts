
// Mock @next-auth/prisma-adapter before importing auth
jest.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: jest.fn(() => ({})),
}))

// Mock next-auth providers
jest.mock('next-auth/providers/credentials', () =>
  jest.fn(({ name, credentials, authorize }: any) => ({
    id: 'credentials',
    type: 'credentials',
    name,
    credentials,
    authorize,
  }))
)

jest.mock('next-auth/providers/google', () =>
  jest.fn(({ clientId, clientSecret }: any) => ({
    id: 'google',
    type: 'oauth',
    name: 'Google',
    clientId,
    clientSecret,
  }))
)

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = {
    ...originalEnv,
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
  }
})

afterEach(() => {
  process.env = originalEnv
})

describe('Auth Configuration', () => {
  it('has providers configured', () => {
    expect(authOptions.providers).toBeDefined()
    expect(authOptions.providers.length).toBeGreaterThan(0)
  })

  it('has credentials provider', () => {
    const cred = authOptions.providers.find((p: any) => p.id === 'credentials')
    expect(cred).toBeDefined()
    expect((cred as any).type).toBe('credentials')
  })

  it('has Google provider', () => {
    const google = authOptions.providers.find((p: any) => p.id === 'google')
    expect(google).toBeDefined()
    expect((google as any).type).toBe('oauth')
  })

  it('has jwt session strategy', () => {
    expect(authOptions.session).toBeDefined()
    expect((authOptions.session as any).strategy).toBe('jwt')
  })

  it('has callbacks defined', () => {
    expect(authOptions.callbacks).toBeDefined()
    expect(typeof authOptions.callbacks!.jwt).toBe('function')
    expect(typeof authOptions.callbacks!.session).toBe('function')
  })

  it('has pages configured', () => {
    expect(authOptions.pages).toBeDefined()
    expect(authOptions.pages!.signIn).toBe('/auth/login')
  })
})

describe('Credentials Provider — authorize', () => {
  const credProvider = () =>
    authOptions.providers.find((p: any) => p.id === 'credentials') as any

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    role: 'CLIENT',
    verified: true,
    googleId: null,
  }

  it('returns null when credentials are missing', async () => {
    const provider = credProvider()
    const result = await provider.authorize({})
    expect(result).toBeNull()
  })

  it('returns null when user is not found', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const provider = credProvider()
    const result = await provider.authorize({ email: 'x@x.com', password: 'pw' })
    expect(result).toBeNull()
  })

  it('returns null when password is invalid', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)
    const provider = credProvider()
    const result = await provider.authorize({ email: 'test@example.com', password: 'wrong' })
    expect(result).toBeNull()
  })

  it('returns user when credentials are valid', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    ;(prisma.user.update as jest.Mock).mockResolvedValue(mockUser)
    const provider = credProvider()
    const result = await provider.authorize({ email: 'test@example.com', password: 'correct' })
    expect(result).not.toBeNull()
    expect((result as any).email).toBe('test@example.com')
    expect((result as any).role).toBe('CLIENT')
  })

  it('throws when user is not verified (non-Google)', async () => {
    const unverifiedUser = { ...mockUser, verified: false, googleId: null }
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(unverifiedUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    const provider = credProvider()
    await expect(
      provider.authorize({ email: 'test@example.com', password: 'correct' })
    ).rejects.toThrow('verify your email')
  })
})

describe('JWT Callback', () => {
  it('adds user data to token when user is present', async () => {
    const token = { sub: 'u1' }
    const user = { id: 'u1', email: 'a@a.com', role: 'CLIENT', verified: true }
    const result = await (authOptions.callbacks!.jwt as any)({ token, user })
    expect((result as any).id).toBe('u1')
    expect((result as any).role).toBe('CLIENT')
  })

  it('returns unchanged token when no user', async () => {
    const token = { sub: 'u1', id: 'u1', role: 'PRO', verified: true }
    const result = await (authOptions.callbacks!.jwt as any)({ token, user: undefined })
    expect(result).toEqual(token)
  })
})

describe('Session Callback', () => {
  it('populates session.user from token', async () => {
    const session = { user: {} as any, expires: '' }
    const token = { id: 'u1', role: 'ADMIN', verified: true }
    const result = await (authOptions.callbacks!.session as any)({ session, token })
    expect(result.user.id).toBe('u1')
    expect(result.user.role).toBe('ADMIN')
  })

  it('returns session unchanged when token is null', async () => {
    const session = { user: {} as any, expires: '' }
    const result = await (authOptions.callbacks!.session as any)({ session, token: null })
    expect(result).toBeDefined()
  })
})

describe('Environment Variables', () => {
  it('NEXTAUTH_SECRET is set in test env', () => {
    expect(process.env.NEXTAUTH_SECRET).toBeDefined()
  })

  it('NEXTAUTH_URL is set in test env', () => {
    expect(process.env.NEXTAUTH_URL).toBeDefined()
  })
})
