import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          verified: user.verified,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.verified = user.verified
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.verified = token.verified as boolean
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser) {
          // Generate a unique username from Google name
          const baseUsername = user.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'
          let username = baseUsername
          let counter = 1
          
          // Check if username exists and generate a unique one
          while (await prisma.user.findUnique({ where: { username } })) {
            username = `${baseUsername}${counter}`
            counter++
          }

          // Create new user from Google with better data mapping
          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              username: username,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              avatar: user.image || '',
              verified: true,
              role: "CLIENT",
              googleId: profile?.sub || null,
            }
          })
          user.id = newUser.id
        } else {
          // Update existing user with Google info if needed
          const updateData: any = {}
          
          if (!existingUser.avatar && user.image) {
            updateData.avatar = user.image
          }
          
          if (!existingUser.firstName && user.name?.split(' ')[0]) {
            updateData.firstName = user.name.split(' ')[0]
          }
          
          if (!existingUser.lastName && user.name?.split(' ').slice(1).join(' ')) {
            updateData.lastName = user.name.split(' ').slice(1).join(' ')
          }
          
          if (!existingUser.googleId && profile?.sub) {
            updateData.googleId = profile.sub
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { email: user.email! },
              data: updateData
            })
          }
          
          user.id = existingUser.id
        }
      }
      return true
    }
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register", // Redirect new users to registration page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
