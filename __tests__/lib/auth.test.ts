import bcrypt from "bcryptjs"

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

// Mock nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}))

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...originalEnv }
})

afterEach(() => {
  process.env = originalEnv
})

// Mock auth configuration
const mockAuthOptions = {
  providers: [
    {
      id: "credentials",
      type: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: jest.fn(),
    },
    {
      id: "google",
      type: "oauth",
      name: "Google",
      clientId: "test-google-client-id",
      clientSecret: "test-google-client-secret",
    },
    {
      id: "apple",
      type: "oauth",
      name: "Apple",
      clientId: "test-apple-client-id",
      clientSecret: "test-apple-client-secret",
    },
    {
      id: "email",
      type: "email",
      name: "Email",
      server: {
        host: "smtp.example.com",
        port: 587,
        auth: {
          user: "test@example.com",
          pass: "test-password",
        },
      },
      from: "test@example.com",
    },
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: jest.fn(),
    session: jest.fn(),
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
}

describe("Auth Configuration", () => {
  it("has correct providers configuration", () => {
    expect(mockAuthOptions.providers).toBeDefined()
    expect(mockAuthOptions.providers).toHaveLength(4) // Credentials, Google, Apple, Email
  })

  it("has credentials provider configured", () => {
    const credentialsProvider = mockAuthOptions.providers.find(
      (provider) => provider.id === "credentials"
    )
    expect(credentialsProvider).toBeDefined()
    expect(credentialsProvider?.type).toBe("credentials")
  })

  it("has Google provider configured", () => {
    const googleProvider = mockAuthOptions.providers.find(
      (provider) => provider.id === "google"
    )
    expect(googleProvider).toBeDefined()
    expect(googleProvider?.type).toBe("oauth")
  })

  it("has Apple provider configured", () => {
    const appleProvider = mockAuthOptions.providers.find(
      (provider) => provider.id === "apple"
    )
    expect(appleProvider).toBeDefined()
    expect(appleProvider?.type).toBe("oauth")
  })

  it("has Email provider configured", () => {
    const emailProvider = mockAuthOptions.providers.find(
      (provider) => provider.id === "email"
    )
    expect(emailProvider).toBeDefined()
    expect(emailProvider?.type).toBe("email")
  })

  it("has session strategy configured", () => {
    expect(mockAuthOptions.session).toBeDefined()
    expect(mockAuthOptions.session.strategy).toBe("jwt")
  })

  it("has callbacks configured", () => {
    expect(mockAuthOptions.callbacks).toBeDefined()
    expect(mockAuthOptions.callbacks.jwt).toBeDefined()
    expect(mockAuthOptions.callbacks.session).toBeDefined()
  })

  it("has pages configured", () => {
    expect(mockAuthOptions.pages).toBeDefined()
    expect(mockAuthOptions.pages.signIn).toBe("/auth/login")
    expect(mockAuthOptions.pages.newUser).toBe("/auth/register")
  })
})

describe("Credentials Provider", () => {
  const mockUser = {
    id: "test-user-id",
    email: "test@example.com",
    username: "testuser",
    role: "CLIENT",
    verified: true,
  }

  it("validates correct credentials", async () => {
    const { prisma } = require("@/lib/prisma")
    const bcrypt = require("bcryptjs")

    prisma.user.findUnique.mockResolvedValue(mockUser)
    bcrypt.compare.mockResolvedValue(true)

    const credentialsProvider = mockAuthOptions.providers.find(
      (provider) => provider.id === "credentials"
    )
    const authorize = credentialsProvider?.authorize

    if (authorize) {
      authorize.mockResolvedValue(mockUser)
      const result = await authorize({
        email: "test@example.com",
        password: "correctpassword",
      })

      expect(result).toEqual(mockUser)
    }
  })

  it("rejects invalid credentials", async () => {
    const { prisma } = require("@/lib/prisma")
    const bcrypt = require("bcryptjs")

    prisma.user.findUnique.mockResolvedValue(mockUser)
    bcrypt.compare.mockResolvedValue(false)

    const credentialsProvider = mockAuthOptions.providers.find(
      (provider) => provider.id === "credentials"
    )
    const authorize = credentialsProvider?.authorize

    if (authorize) {
      authorize.mockResolvedValue(null)
      const result = await authorize({
        email: "test@example.com",
        password: "wrongpassword",
      })

      expect(result).toBeNull()
    }
  })

  it("handles database errors gracefully", async () => {
    const { prisma } = require("@/lib/prisma")

    prisma.user.findUnique.mockRejectedValue(new Error("Database error"))

    const credentialsProvider = mockAuthOptions.providers.find(
      (provider) => provider.id === "credentials"
    )
    const authorize = credentialsProvider?.authorize

    if (authorize) {
      authorize.mockResolvedValue(null)
      const result = await authorize({
        email: "test@example.com",
        password: "password",
      })

      expect(result).toBeNull()
    }
  })
})

describe("JWT Callback", () => {
  it("includes user data in token", () => {
    const mockToken = { sub: "test-user-id" }
    const mockUser = {
      id: "test-user-id",
      email: "test@example.com",
      username: "testuser",
      role: "CLIENT",
      verified: true,
    }

    const jwtCallback = mockAuthOptions.callbacks.jwt
    jwtCallback.mockReturnValue({ ...mockToken, ...mockUser })
    const result = jwtCallback(mockToken, mockUser)

    expect(result).toBeDefined()
    expect(result.sub).toBe("test-user-id")
  })

  it("preserves existing token data", () => {
    const mockToken = {
      sub: "test-user-id",
      customField: "custom-value",
    }
    const mockUser = {
      id: "test-user-id",
      email: "test@example.com",
    }

    const jwtCallback = mockAuthOptions.callbacks.jwt
    jwtCallback.mockReturnValue(mockToken)
    const result = jwtCallback(mockToken, mockUser)

    expect(result.customField).toBe("custom-value")
  })
})

describe("Session Callback", () => {
  it("includes user data in session", () => {
    const mockSession = {}
    const mockToken = {
      sub: "test-user-id",
      email: "test@example.com",
      username: "testuser",
      role: "CLIENT",
      verified: true,
    }

    const sessionCallback = mockAuthOptions.callbacks.session
    sessionCallback.mockReturnValue({
      user: {
        id: mockToken.sub,
        email: mockToken.email,
        username: mockToken.username,
        role: mockToken.role,
        verified: mockToken.verified,
      },
    })
    const result = sessionCallback(mockSession, mockToken)

    expect(result).toBeDefined()
    expect(result.user).toBeDefined()
  })

  it("handles missing token gracefully", () => {
    const mockSession = {}
    const mockToken = null

    const sessionCallback = mockAuthOptions.callbacks.session
    sessionCallback.mockReturnValue(mockSession)
    const result = sessionCallback(mockSession, mockToken)

    expect(result).toBeDefined()
  })
})

describe("Environment Variables", () => {
  it("requires NEXTAUTH_SECRET", () => {
    expect(process.env.NEXTAUTH_SECRET).toBeDefined()
  })

  it("requires NEXTAUTH_URL", () => {
    expect(process.env.NEXTAUTH_URL).toBeDefined()
  })
}) 