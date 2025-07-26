import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    // Get posts count
    const postsCount = await prisma.post.count({
      where: {
        authorId: userId,
      },
    })

    // Get followers count (users who follow this user)
    const followersCount = await prisma.follow.count({
      where: {
        followingId: userId,
      },
    })

    // Get following count (users this user follows)
    const followingCount = await prisma.follow.count({
      where: {
        followerId: userId,
      },
    })

    return NextResponse.json({
      posts: postsCount,
      followers: followersCount,
      following: followingCount,
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    )
  }
} 