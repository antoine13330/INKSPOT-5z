import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Only allow users to update their own profile
    if (session.user.id !== params.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { username, bio, location, website, phone } = body

    // Check if username is already taken by another user
    if (username && username !== session.user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      })
      if (existingUser) {
        return NextResponse.json(
          { message: "Username already taken" },
          { status: 400 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        username: username || undefined,
        bio: bio || undefined,
        location: location || undefined,
        website: website || undefined,
        phone: phone || undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        role: true,
        verified: true,
        businessName: true,
        specialties: true,
        bio: true,
        location: true,
        website: true,
        phone: true,
      },
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
} 