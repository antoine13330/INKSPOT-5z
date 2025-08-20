import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: postId } = await params

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Fetch the post with author information
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            businessName: true,
            avatar: true,
            verified: true,
            role: true
          }
        },
        collaborations: {
          include: {
            pro: {
              select: {
                id: true,
                username: true,
                businessName: true,
                avatar: true
              }
            }
          }
        },
        likes: {
          where: session?.user?.id ? { userId: session.user.id } : undefined,
          select: { id: true }
        }
      }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.post.update({
      where: { id: postId },
      data: { viewsCount: { increment: 1 } }
    })

    // Transform the data to match the expected interface
    const transformedPost = {
      id: post.id,
      content: post.content,
      images: post.images,
      hashtags: post.hashtags,
      price: post.price,
      isCollaboration: post.isCollaboration,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      viewsCount: post.viewsCount + 1, // Include the new view
      publishedAt: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
      createdAt: post.createdAt.toISOString(),
      liked: post.likes.length > 0,
      author: {
        id: post.author.id,
        username: post.author.username,
        businessName: post.author.businessName,
        avatar: post.author.avatar
      },
      collaborations: post.collaborations.map((collab: any) => ({
        id: collab.id,
        status: collab.status,
        pro: {
          id: collab.pro.id,
          username: collab.pro.username,
          businessName: collab.pro.businessName,
          avatar: collab.pro.avatar
        }
      }))
    }

    return NextResponse.json({
      post: transformedPost,
      success: true
    })

  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: postId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { content, images, hashtags, price, isCollaboration } = body

    // Check if user owns the post
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content,
        images,
        price,
        isCollaboration,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      post: updatedPost,
      success: true
    })

  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id: postId } = await params

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Check if user owns the post
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Delete the post and all related data
    await prisma.post.delete({
      where: { id: postId }
    })

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
