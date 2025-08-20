import { NextRequest, NextResponse } from "next/server"
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
		const { id } = await params
		const userId = await resolveUserId(id)
		if (!userId) {
			return NextResponse.json({ message: "User not found" }, { status: 404 })
		}

		const posts = await prisma.post.findMany({
			where: { authorId: userId },
			orderBy: { createdAt: "desc" },
			include: {
				author: {
					select: { id: true, username: true, businessName: true, avatar: true },
				},
				collaborations: {
					include: { pro: { select: { id: true, username: true, businessName: true, avatar: true } } },
				},
			},
		})

		const transformed = posts.map((post) => ({
			id: post.id,
			content: post.content,
			images: post.images,
			hashtags: post.hashtags,
			price: post.price ?? undefined,
			isCollaboration: post.isCollaboration,
			likesCount: post.likesCount,
			commentsCount: post.commentsCount,
			viewsCount: post.viewsCount,
			publishedAt: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
			createdAt: post.createdAt.toISOString(),
			author: {
				id: post.author.id,
				username: post.author.username,
				businessName: post.author.businessName ?? undefined,
				avatar: post.author.avatar ?? undefined,
			},
			collaborations: post.collaborations.map((c) => ({
				id: c.id,
				status: c.status,
				pro: {
					id: c.pro.id,
					username: c.pro.username,
					businessName: c.pro.businessName ?? undefined,
					avatar: c.pro.avatar ?? undefined,
				},
			})),
		}))

		return NextResponse.json({ posts: transformed })
	} catch (error) {
		console.error("Error fetching user posts:", error)
		return NextResponse.json({ message: "Internal server error" }, { status: 500 })
	}
}



