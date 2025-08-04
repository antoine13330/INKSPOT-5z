import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Prometheus metrics format helper
function formatMetric(name: string, value: number, labels: Record<string, string> = {}, help?: string): string {
  const labelStr = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',')
  const labelsFormatted = labelStr ? `{${labelStr}}` : ''
  
  let result = ''
  if (help) {
    result += `# HELP ${name} ${help}\n`
    result += `# TYPE ${name} gauge\n`
  }
  result += `${name}${labelsFormatted} ${value}\n`
  return result
}

export async function GET(request: NextRequest) {
  try {
    const metrics: string[] = []

    // === USER METRICS ===
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({
      where: {
        status: 'ACTIVE'
      }
    })
    const proUsers = await prisma.user.count({
      where: {
        role: 'PRO'
      }
    })
    const verifiedUsers = await prisma.user.count({
      where: {
        verified: true
      }
    })

    // New users in the last 24 hours
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    // Active users in the last 24 hours
    const activeUsersToday = await prisma.user.count({
      where: {
        lastActiveAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    metrics.push(formatMetric('inkspot_users_total', totalUsers, {}, 'Total number of users'))
    metrics.push(formatMetric('inkspot_users_active', activeUsers, {}, 'Number of active users'))
    metrics.push(formatMetric('inkspot_users_pro', proUsers, {}, 'Number of PRO users'))
    metrics.push(formatMetric('inkspot_users_verified', verifiedUsers, {}, 'Number of verified users'))
    metrics.push(formatMetric('inkspot_users_new_today', newUsersToday, {}, 'New users registered today'))
    metrics.push(formatMetric('inkspot_users_active_today', activeUsersToday, {}, 'Users active today'))

    // === POST METRICS ===
    const totalPosts = await prisma.post.count()
    const publishedPosts = await prisma.post.count({
      where: {
        status: 'PUBLISHED'
      }
    })
    const postsToday = await prisma.post.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    const totalLikes = await prisma.like.count()
    const totalComments = await prisma.comment.count()
    const likesToday = await prisma.like.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    metrics.push(formatMetric('inkspot_posts_total', totalPosts, {}, 'Total number of posts'))
    metrics.push(formatMetric('inkspot_posts_published', publishedPosts, {}, 'Number of published posts'))
    metrics.push(formatMetric('inkspot_posts_today', postsToday, {}, 'Posts created today'))
    metrics.push(formatMetric('inkspot_likes_total', totalLikes, {}, 'Total number of likes'))
    metrics.push(formatMetric('inkspot_comments_total', totalComments, {}, 'Total number of comments'))
    metrics.push(formatMetric('inkspot_likes_today', likesToday, {}, 'Likes given today'))

    // === MESSAGING METRICS ===
    const totalConversations = await prisma.conversation.count()
    const totalMessages = await prisma.message.count()
    const messagesToday = await prisma.message.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    metrics.push(formatMetric('inkspot_conversations_total', totalConversations, {}, 'Total number of conversations'))
    metrics.push(formatMetric('inkspot_messages_total', totalMessages, {}, 'Total number of messages'))
    metrics.push(formatMetric('inkspot_messages_today', messagesToday, {}, 'Messages sent today'))

    // === BOOKING METRICS ===
    const totalBookings = await prisma.booking.count()
    const pendingBookings = await prisma.booking.count({
      where: {
        status: 'PENDING'
      }
    })
    const confirmedBookings = await prisma.booking.count({
      where: {
        status: 'CONFIRMED'
      }
    })
    const completedBookings = await prisma.booking.count({
      where: {
        status: 'COMPLETED'
      }
    })

    const bookingsToday = await prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    metrics.push(formatMetric('inkspot_bookings_total', totalBookings, {}, 'Total number of bookings'))
    metrics.push(formatMetric('inkspot_bookings_pending', pendingBookings, {}, 'Number of pending bookings'))
    metrics.push(formatMetric('inkspot_bookings_confirmed', confirmedBookings, {}, 'Number of confirmed bookings'))
    metrics.push(formatMetric('inkspot_bookings_completed', completedBookings, {}, 'Number of completed bookings'))
    metrics.push(formatMetric('inkspot_bookings_today', bookingsToday, {}, 'Bookings created today'))

    // === PAYMENT METRICS ===
    const totalPayments = await prisma.payment.count()
    const successfulPayments = await prisma.payment.count({
      where: {
        status: 'COMPLETED'
      }
    })
    const pendingPayments = await prisma.payment.count({
      where: {
        status: 'PENDING'
      }
    })
    const failedPayments = await prisma.payment.count({
      where: {
        status: 'FAILED'
      }
    })

    // Revenue calculations
    const totalRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    })

    const revenueToday = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      _sum: {
        amount: true
      }
    })

    metrics.push(formatMetric('inkspot_payments_total', totalPayments, {}, 'Total number of payments'))
    metrics.push(formatMetric('inkspot_payments_successful', successfulPayments, {}, 'Number of successful payments'))
    metrics.push(formatMetric('inkspot_payments_pending', pendingPayments, {}, 'Number of pending payments'))
    metrics.push(formatMetric('inkspot_payments_failed', failedPayments, {}, 'Number of failed payments'))
    metrics.push(formatMetric('inkspot_revenue_total', totalRevenue._sum.amount || 0, {}, 'Total revenue in EUR'))
    metrics.push(formatMetric('inkspot_revenue_today', revenueToday._sum.amount || 0, {}, 'Revenue today in EUR'))

    // === NOTIFICATION METRICS ===
    const totalNotifications = await prisma.notification.count()
    const unreadNotifications = await prisma.notification.count({
      where: {
        read: false
      }
    })

    metrics.push(formatMetric('inkspot_notifications_total', totalNotifications, {}, 'Total number of notifications'))
    metrics.push(formatMetric('inkspot_notifications_unread', unreadNotifications, {}, 'Number of unread notifications'))

    // === ENGAGEMENT METRICS ===
    const totalFollows = await prisma.follow.count()
    const totalReviews = await prisma.review.count()
    const averageRating = await prisma.review.aggregate({
      _avg: {
        rating: true
      }
    })

    metrics.push(formatMetric('inkspot_follows_total', totalFollows, {}, 'Total number of follows'))
    metrics.push(formatMetric('inkspot_reviews_total', totalReviews, {}, 'Total number of reviews'))
    metrics.push(formatMetric('inkspot_rating_average', averageRating._avg.rating || 0, {}, 'Average rating'))

    // === SEARCH METRICS ===
    const totalSearches = await prisma.searchHistory.count()
    const searchesToday = await prisma.searchHistory.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    metrics.push(formatMetric('inkspot_searches_total', totalSearches, {}, 'Total number of searches'))
    metrics.push(formatMetric('inkspot_searches_today', searchesToday, {}, 'Searches performed today'))

    // === SYSTEM METRICS ===
    const currentTime = Date.now()
    metrics.push(formatMetric('inkspot_last_metrics_update', Math.floor(currentTime / 1000), {}, 'Last metrics update timestamp'))

    // Return metrics in Prometheus format
    return new NextResponse(metrics.join('\n'), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Error generating metrics:', error)
    return NextResponse.json({ error: 'Failed to generate metrics' }, { status: 500 })
  }
} 