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

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await getServerSession(authOptions)
		const { id } = await params

		if (!session?.user?.id) {
			return NextResponse.json({ isFollowing: false })
		}

		const targetUserId = await resolveUserId(id)
		if (!targetUserId) {
			return NextResponse.json({ message: "User not found" }, { status: 404 })
		}

		if (targetUserId === session.user.id) {
			return NextResponse.json({ isFollowing: false })
		}

		const follow = await prisma.follow.findUnique({
			where: {
				followerId_followingId: {
					followerId: session.user.id,
					followingId: targetUserId,
				},
			},
		})

		return NextResponse.json({ isFollowing: Boolean(follow) })
	} catch (error) {
		console.error("Error checking follow status:", error)
		return NextResponse.json({ message: "Internal server error" }, { status: 500 })
	}
}



