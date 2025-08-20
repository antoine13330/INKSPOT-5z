import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

async function resolveUserId(idOrUsername: string): Promise<string | null> {
	const user = await prisma.user.findFirst({
		where: { OR: [{ id: idOrUsername }, { username: idOrUsername }] },
		select: { id: true },
	})
	return user?.id ?? null
}

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
		}

		const { id } = await params
		const targetUserId = await resolveUserId(id)
		if (!targetUserId) {
			return NextResponse.json({ message: "User not found" }, { status: 404 })
		}

		if (targetUserId === session.user.id) {
			return NextResponse.json({ message: "Cannot follow yourself" }, { status: 400 })
		}

		await prisma.follow.upsert({
			where: {
				followerId_followingId: {
					followerId: session.user.id,
					followingId: targetUserId,
				},
			},
			create: { followerId: session.user.id, followingId: targetUserId },
			update: {},
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error following user:", error)
		return NextResponse.json({ message: "Internal server error" }, { status: 500 })
	}
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession(authOptions)
		if (!session?.user?.id) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
		}

		const { id } = await params
		const targetUserId = await resolveUserId(id)
		if (!targetUserId) {
			return NextResponse.json({ message: "User not found" }, { status: 404 })
		}

		await prisma.follow.deleteMany({
			where: {
				followerId: session.user.id,
				followingId: targetUserId,
			},
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error unfollowing user:", error)
		return NextResponse.json({ message: "Internal server error" }, { status: 500 })
	}
}



