import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { sendMagicLinkEmail } from "./email"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          username: profile.email.split("@")[0],
          firstName: profile.given_name,
          lastName: profile.family_name,
          avatar: profile.picture,
          googleId: profile.sub,
          role: "CLIENT",
        }
      },
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          username: profile.email?.split("@")[0] || `user_${profile.sub.slice(0, 8)}`,
          firstName: profile.name?.firstName,
          lastName: profile.name?.lastName,
          appleId: profile.sub,
          role: "CLIENT",
        }
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        await sendMagicLinkEmail(email, url)
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user) {
        token.role = user.role
        token.username = user.username
        token.avatar = user.avatar
      }

      return token
    },
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in
      if (account?.provider === "google" && account.providerAccountId) {
        const existingUser = await prisma.user.findUnique({
          where: { googleId: account.providerAccountId },
        })

        if (!existingUser && user?.email) {
          // Create user with Google ID
          await prisma.user.create({
            data: {
              email: user.email,
              username: user.email.split("@")[0],
              firstName: user.name?.split(" ")[0],
              lastName: user.name?.split(" ").slice(1).join(" "),
              avatar: user.image,
              googleId: account.providerAccountId,
              role: "CLIENT",
              emailVerified: new Date(),
            },
          })
        }
      }

      if (account?.provider === "apple" && account.providerAccountId) {
        const existingUser = await prisma.user.findUnique({
          where: { appleId: account.providerAccountId },
        })

        if (!existingUser && user?.email) {
          await prisma.user.create({
            data: {
              email: user.email,
              username: user.email?.split("@")[0] || `user_${account.providerAccountId.slice(0, 8)}`,
              appleId: account.providerAccountId,
              role: "CLIENT",
              emailVerified: new Date(),
            },
          })
        }
      }

      return true
    },
    session: async ({ session, token }) => {
      if (token?.sub) {
        // Get fresh user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            username: true,
            avatar: true,
            role: true,
            verified: true,
            businessName: true,
            specialties: true,
          },
        })

        if (dbUser) {
          session.user.id = dbUser.id
          session.user.username = dbUser.username
          session.user.avatar = dbUser.avatar
          session.user.role = dbUser.role
          session.user.verified = dbUser.verified
          session.user.businessName = dbUser.businessName
          session.user.specialties = dbUser.specialties
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    signUp: "/auth/register",
    verifyRequest: "/auth/verify-request",
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      if (isNewUser && user.email) {
        // Send welcome notification
        await prisma.notification.create({
          data: {
            title: "Welcome to Social Media Pro!",
            message: "Complete your profile to get started",
            type: "SYSTEM",
            userId: user.id,
          },
        })
      }
    },
  },
}
