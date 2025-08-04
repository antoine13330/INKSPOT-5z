import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "Grafana JSON API endpoint" })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type } = body

    switch (type) {
      case 'search':
        return handleSearch()
      case 'query':
        return handleQuery(body)
      default:
        return NextResponse.json({ error: 'Unknown request type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Grafana API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleSearch() {
  // Return available metrics/targets for Grafana
  const targets = [
    'user_registrations',
    'user_activity',
    'post_engagement',
    'revenue_metrics',
    'booking_conversion',
    'message_volume',
    'search_trends',
    'user_demographics',
    'payment_success_rate',
    'notification_delivery'
  ]
  
  return NextResponse.json(targets)
}

async function handleQuery(body: any) {
  const { targets, range } = body
  const from = new Date(range.from)
  const to = new Date(range.to)
  
  const results = []
  
  for (const target of targets) {
    switch (target.target) {
      case 'user_registrations':
        results.push(await getUserRegistrations(from, to))
        break
      case 'user_activity':
        results.push(await getUserActivity(from, to))
        break
      case 'post_engagement':
        results.push(await getPostEngagement(from, to))
        break
      case 'revenue_metrics':
        results.push(await getRevenueMetrics(from, to))
        break
      case 'booking_conversion':
        results.push(await getBookingConversion(from, to))
        break
      case 'message_volume':
        results.push(await getMessageVolume(from, to))
        break
      case 'search_trends':
        results.push(await getSearchTrends(from, to))
        break
      case 'user_demographics':
        results.push(await getUserDemographics())
        break
      case 'payment_success_rate':
        results.push(await getPaymentSuccessRate(from, to))
        break
      case 'notification_delivery':
        results.push(await getNotificationDelivery(from, to))
        break
      default:
        results.push({
          target: target.target,
          datapoints: []
        })
    }
  }
  
  return NextResponse.json(results)
}

async function getUserRegistrations(from: Date, to: Date) {
  const registrations = await prisma.user.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    _count: {
      id: true
    }
  })

  const datapoints = registrations.map(reg => [
    reg._count.id,
    new Date(reg.createdAt).getTime()
  ])

  return {
    target: 'user_registrations',
    datapoints
  }
}

async function getUserActivity(from: Date, to: Date) {
  const activity = await prisma.user.groupBy({
    by: ['lastActiveAt'],
    where: {
      lastActiveAt: {
        gte: from,
        lte: to
      }
    },
    _count: {
      id: true
    }
  })

  const datapoints = activity.map(act => [
    act._count.id,
    new Date(act.lastActiveAt || from).getTime()
  ])

  return {
    target: 'user_activity',
    datapoints
  }
}

async function getPostEngagement(from: Date, to: Date) {
  const posts = await prisma.post.findMany({
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    select: {
      createdAt: true,
      likesCount: true,
      commentsCount: true,
      viewsCount: true
    }
  })

  const datapoints = posts.map(post => [
    post.likesCount + post.commentsCount + post.viewsCount,
    new Date(post.createdAt).getTime()
  ])

  return {
    target: 'post_engagement',
    datapoints
  }
}

async function getRevenueMetrics(from: Date, to: Date) {
  const payments = await prisma.payment.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: {
        gte: from,
        lte: to
      }
    },
    select: {
      amount: true,
      createdAt: true
    }
  })

  // Group by day and sum amounts
  const dailyRevenue = new Map()
  payments.forEach(payment => {
    const day = new Date(payment.createdAt).toDateString()
    dailyRevenue.set(day, (dailyRevenue.get(day) || 0) + payment.amount)
  })

  const datapoints = Array.from(dailyRevenue.entries()).map(([day, amount]) => [
    amount,
    new Date(day).getTime()
  ])

  return {
    target: 'revenue_metrics',
    datapoints
  }
}

async function getBookingConversion(from: Date, to: Date) {
  const bookings = await prisma.booking.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    _count: {
      id: true
    }
  })

  const total = bookings.reduce((sum, booking) => sum + booking._count.id, 0)
  const completed = bookings.find(b => b.status === 'COMPLETED')?._count.id || 0
  const conversionRate = total > 0 ? (completed / total) * 100 : 0

  return {
    target: 'booking_conversion',
    datapoints: [[conversionRate, Date.now()]]
  }
}

async function getMessageVolume(from: Date, to: Date) {
  const messages = await prisma.message.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    _count: {
      id: true
    }
  })

  const datapoints = messages.map(msg => [
    msg._count.id,
    new Date(msg.createdAt).getTime()
  ])

  return {
    target: 'message_volume',
    datapoints
  }
}

async function getSearchTrends(from: Date, to: Date) {
  const searches = await prisma.searchHistory.groupBy({
    by: ['query'],
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10
  })

  const datapoints = searches.map((search, index) => [
    search._count.id,
    Date.now() + index // Spread them out for visualization
  ])

  return {
    target: 'search_trends',
    datapoints
  }
}

async function getUserDemographics() {
  const demographics = await prisma.user.groupBy({
    by: ['role'],
    _count: {
      id: true
    }
  })

  const datapoints = demographics.map(demo => [
    demo._count.id,
    Date.now()
  ])

  return {
    target: 'user_demographics',
    datapoints
  }
}

async function getPaymentSuccessRate(from: Date, to: Date) {
  const payments = await prisma.payment.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    _count: {
      id: true
    }
  })

  const total = payments.reduce((sum, payment) => sum + payment._count.id, 0)
  const successful = payments.find(p => p.status === 'COMPLETED')?._count.id || 0
  const successRate = total > 0 ? (successful / total) * 100 : 0

  return {
    target: 'payment_success_rate',
    datapoints: [[successRate, Date.now()]]
  }
}

async function getNotificationDelivery(from: Date, to: Date) {
  const notifications = await prisma.notification.groupBy({
    by: ['read'],
    where: {
      createdAt: {
        gte: from,
        lte: to
      }
    },
    _count: {
      id: true
    }
  })

  const total = notifications.reduce((sum, notif) => sum + notif._count.id, 0)
  const read = notifications.find(n => n.read === true)?._count.id || 0
  const deliveryRate = total > 0 ? (read / total) * 100 : 0

  return {
    target: 'notification_delivery',
    datapoints: [[deliveryRate, Date.now()]]
  }
}