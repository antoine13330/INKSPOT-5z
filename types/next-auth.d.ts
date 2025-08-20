import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      firstName?: string
      lastName?: string
      avatar?: string
      role: "CLIENT" | "PRO" | "ADMIN"
      verified: boolean
      businessName?: string
      specialties?: string[]
      bio?: string
      location?: string
      website?: string
      phone?: string
    }
  }

  interface User {
    id: string
    email: string
    username: string
    firstName?: string
    lastName?: string
    avatar?: string
    role: "CLIENT" | "PRO" | "ADMIN"
    verified: boolean
    businessName?: string
    specialties?: string[]
    bio?: string
    location?: string
    website?: string
    phone?: string
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
    bio?: string
    location?: string
    website?: string
    phone?: string
  }
}