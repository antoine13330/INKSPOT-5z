import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body
    const userId = params.id

    let updateData: unknown = {}

    switch (action) {
      case "suspend":
        updateData = { status: "SUSPENDED" }
        break
      case "activate":
        updateData = { status: "ACTIVE" }
        break
      case "verify":
        updateData = { verified: true }
        break
      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        verified: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      message: "User updated successfully",
      user,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
