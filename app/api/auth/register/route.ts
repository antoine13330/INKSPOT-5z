import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      bio,
      location,
      website,
      role,
      specialties,
      businessName,
      businessAddress,
      siret,
      vatNumber,
      hourlyRate,
    } = body

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email or username already exists" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        bio,
        location,
        website,
        role: role || "CLIENT",
        specialties: specialties || [],
        businessName: role === "PRO" ? businessName : null,
        businessAddress: role === "PRO" ? businessAddress : null,
        siret: role === "PRO" ? siret : null,
        vatNumber: role === "PRO" ? vatNumber : null,
        hourlyRate: role === "PRO" && hourlyRate ? Number.parseFloat(hourlyRate) : null,
      },
    })

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "User created successfully",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
