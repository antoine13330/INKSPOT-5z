import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      avatar?: string
      role: "CLIENT" | "PRO" | "ADMIN"
      verified: boolean
      businessName?: string
      specialties?: string[]
    }
  }

  interface User {
    id: string
    email: string
    username: string
    avatar?: string
    role: "CLIENT" | "PRO" | "ADMIN"
    verified: boolean
    businessName?: string
    specialties?: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "CLIENT" | "PRO" | "ADMIN"
    username: string
    avatar?: string
    verified: boolean
    businessName?: string
    specialties?: string[]
  }
}