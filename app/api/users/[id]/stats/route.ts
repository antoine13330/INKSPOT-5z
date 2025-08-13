import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user's posts count
    const postsCount = await prisma.post.count({
      where: { authorId: id }
    });

    // Get user's followers count
    const followersCount = await prisma.follow.count({
      where: { followingId: id }
    });

    // Get user's following count
    const followingCount = await prisma.follow.count({
      where: { followerId: id }
    });

    return NextResponse.json({
      postsCount,
      followersCount,
      followingCount
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 