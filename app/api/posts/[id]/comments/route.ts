import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Fetch comments for the post
    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            businessName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Transform the data to match the expected interface
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        username: comment.author.username,
        businessName: comment.author.businessName,
        avatar: comment.author.avatar
      }
    }))

    return NextResponse.json({
      comments: transformedComments,
      success: true
    })

  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            businessName: true,
            avatar: true
          }
        }
      }
    })

    // Increment comment count on the post
    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } }
    })

    // Transform the data to match the expected interface
    const transformedComment = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.author.id,
        username: comment.author.username,
        businessName: comment.author.businessName,
        avatar: comment.author.avatar
      }
    }

    return NextResponse.json({
      comment: transformedComment,
      success: true
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
