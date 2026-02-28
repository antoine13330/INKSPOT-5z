import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const proId = searchParams.get("proId") || session.user.id
    const timeRange = searchParams.get("timeRange") || "30d"

    // Check if user can access this data
    const isAdmin = session.user.role === "ADMIN"
    const isPro = session.user.id === proId

    if (!isAdmin && !isPro) {
      return NextResponse.json({ message: "Not authorized to view this data" }, { status: 403 })
    }

    // Calculate date ranges
    const now = new Date()
    let startDate: Date
    const endDate = now

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Get all bookings for the professional
    const bookings = await prisma.booking.findMany({
      where: {
        proId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: true,
        payments: true,
      },
    })

    // Get all payments for the professional
    const payments = await prisma.payment.findMany({
      where: {
        receiverId: proId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "COMPLETED",
      },
      include: {
        booking: true,
      },
    })

    // Calculate overview metrics
    const totalRevenue = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
    const monthlyRevenue = payments
      .filter((payment: any) => {
        const paymentDate = new Date(payment.createdAt)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return paymentDate >= monthStart
      })
      .reduce((sum: number, payment: any) => sum + payment.amount, 0)

    const totalBookings = bookings.length
    const completedBookings = bookings.filter((booking: any) => booking.status === "COMPLETED").length
    const pendingBookings = bookings.filter((booking: any) => booking.status === "PENDING").length
    const cancelledBookings = bookings.filter((booking: any) => booking.status === "CANCELLED").length

    // Get unique clients
    const uniqueClients = new Set(bookings.map((booking: any) => booking.clientId))
    const totalClients = uniqueClients.size

    // Get reviews and ratings
    const reviews = await prisma.review.findMany({
      where: {
        reviewedId: proId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
      : 0
    const totalReviews = reviews.length

    // Calculate revenue trends
    const dailyRevenue = await calculateDailyRevenue(proId, startDate, endDate)
    const weeklyRevenue = await calculateWeeklyRevenue(proId, startDate, endDate)
    const monthlyRevenueData = await calculateMonthlyRevenue(proId, startDate, endDate)

    // Calculate booking statistics
    const bookingsByStatus = [
      { status: "PENDING", count: pendingBookings },
      { status: "CONFIRMED", count: bookings.filter((b: any) => b.status === "CONFIRMED").length },
      { status: "COMPLETED", count: completedBookings },
      { status: "CANCELLED", count: cancelledBookings },
    ]

    const bookingsByMonth = await calculateBookingsByMonth(proId, startDate, endDate)
    const bookingsByTimeSlot = await calculateBookingsByTimeSlot(proId, startDate, endDate)

    // Calculate client statistics
    const newClients = await calculateNewClients(proId, startDate, endDate)
    const repeatClients = await calculateRepeatClients(proId, startDate, endDate)
    const topClients = await calculateTopClients(proId, startDate, endDate)

    // Calculate performance metrics
    const conversionRate = totalBookings > 0 ? completedBookings / totalBookings : 0
    const averageSessionDuration = await calculateAverageSessionDuration(proId, startDate, endDate)
    const peakHours = await calculatePeakHours(proId, startDate, endDate)
    const popularServices = await calculatePopularServices(proId, startDate, endDate)

    const analyticsData = {
      overview: {
        totalRevenue,
        monthlyRevenue,
        totalBookings,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        totalClients,
        averageRating,
        totalReviews,
      },
      revenue: {
        daily: dailyRevenue,
        weekly: weeklyRevenue,
        monthly: monthlyRevenueData,
      },
      bookings: {
        byStatus: bookingsByStatus,
        byMonth: bookingsByMonth,
        byTimeSlot: bookingsByTimeSlot,
      },
      clients: {
        newClients,
        repeatClients,
        topClients,
      },
      performance: {
        conversionRate,
        averageSessionDuration,
        peakHours,
        popularServices,
      },
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

async function calculateDailyRevenue(proId: string, startDate: Date, endDate: Date) {
  const payments = await prisma.payment.findMany({
    where: {
      receiverId: proId,
      status: "COMPLETED",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      amount: true,
      createdAt: true,
    },
  })

  const dailyRevenue: { [key: string]: number } = {}
  
  payments.forEach((payment: any) => {
    const date = new Date(payment.createdAt).toISOString().split('T')[0]
    dailyRevenue[date] = (dailyRevenue[date] || 0) + payment.amount
  })

  return Object.entries(dailyRevenue)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

async function calculateWeeklyRevenue(proId: string, startDate: Date, endDate: Date) {
  const payments = await prisma.payment.findMany({
    where: {
      receiverId: proId,
      status: "COMPLETED",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      amount: true,
      createdAt: true,
    },
  })

  const weeklyRevenue: { [key: string]: number } = {}
  
  payments.forEach((payment: any) => {
    const date = new Date(payment.createdAt)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    weeklyRevenue[weekKey] = (weeklyRevenue[weekKey] || 0) + payment.amount
  })

  return Object.entries(weeklyRevenue)
    .map(([week, amount]) => ({ week, amount }))
    .sort((a, b) => a.week.localeCompare(b.week))
}

async function calculateMonthlyRevenue(proId: string, startDate: Date, endDate: Date) {
  const payments = await prisma.payment.findMany({
    where: {
      receiverId: proId,
      status: "COMPLETED",
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      amount: true,
      createdAt: true,
    },
  })

  const monthlyRevenue: { [key: string]: number } = {}
  
  payments.forEach((payment: any) => {
    const date = new Date(payment.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + payment.amount
  })

  return Object.entries(monthlyRevenue)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

async function calculateBookingsByMonth(proId: string, startDate: Date, endDate: Date) {
  const bookings = await prisma.booking.findMany({
    where: {
      proId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
    },
  })

  const monthlyBookings: { [key: string]: number } = {}
  
  bookings.forEach((booking: any) => {
    const date = new Date(booking.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyBookings[monthKey] = (monthlyBookings[monthKey] || 0) + 1
  })

  return Object.entries(monthlyBookings)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

async function calculateBookingsByTimeSlot(proId: string, startDate: Date, endDate: Date) {
  const bookings = await prisma.booking.findMany({
    where: {
      proId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      startTime: true,
    },
  })

  const hourlyBookings: { [key: string]: number } = {}
  
  bookings.forEach((booking: any) => {
    const hour = new Date(booking.startTime).getHours()
    const hourKey = `${hour.toString().padStart(2, '0')}:00`
    hourlyBookings[hourKey] = (hourlyBookings[hourKey] || 0) + 1
  })

  return Object.entries(hourlyBookings)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour))
}

async function calculateNewClients(proId: string, startDate: Date, endDate: Date) {
  const newClients = await prisma.booking.groupBy({
    by: ['clientId'],
    where: {
      proId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      clientId: true,
    },
  })

  const monthlyNewClients: { [key: string]: number } = {}
  
  // This is a simplified calculation - in a real app you'd want to track first booking dates
  const totalNewClients = newClients.length
  const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
  
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(startDate)
    monthDate.setMonth(startDate.getMonth() + i)
    const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    monthlyNewClients[monthKey] = Math.floor(totalNewClients / months)
  }

  return Object.entries(monthlyNewClients)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

async function calculateRepeatClients(proId: string, startDate: Date, endDate: Date) {
  const clientBookings = await prisma.booking.groupBy({
    by: ['clientId'],
    where: {
      proId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      clientId: true,
    },
  })

  return clientBookings.filter((client: any) => client._count.clientId > 1).length
}

async function calculateTopClients(proId: string, startDate: Date, endDate: Date) {
  const clientStats = await prisma.booking.groupBy({
    by: ['clientId'],
    where: {
      proId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      clientId: true,
    },
    _sum: {
      price: true,
    },
  })

  const topClients = await Promise.all(
    clientStats
      .sort((a: any, b: any) => (b._sum.price || 0) - (a._sum.price || 0))
      .slice(0, 10)
      .map(async (client: any) => {
        const user = await prisma.user.findUnique({
          where: { id: client.clientId },
          select: { username: true, firstName: true, lastName: true },
        })
        
        return {
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Unknown',
          bookings: client._count.clientId,
          revenue: client._sum.price || 0,
        }
      })
  )

  return topClients
}

async function calculateAverageSessionDuration(proId: string, startDate: Date, endDate: Date) {
  const completedBookings = await prisma.booking.findMany({
    where: {
      proId,
      status: "COMPLETED",
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  })

  if (completedBookings.length === 0) return 0

  const totalDuration = completedBookings.reduce((sum: number, booking: any) => {
    const duration = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()
    return sum + duration
  }, 0)

  return Math.round(totalDuration / (completedBookings.length * 60 * 1000)) // Convert to minutes
}

async function calculatePeakHours(proId: string, startDate: Date, endDate: Date) {
  const bookings = await prisma.booking.findMany({
    where: {
      proId,
      startTime: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      startTime: true,
    },
  })

  const hourlyBookings: { [key: string]: number } = {}
  
  bookings.forEach((booking: any) => {
    const hour = new Date(booking.startTime).getHours()
    const hourKey = `${hour.toString().padStart(2, '0')}:00`
    hourlyBookings[hourKey] = (hourlyBookings[hourKey] || 0) + 1
  })

  return Object.entries(hourlyBookings)
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
}

async function calculatePopularServices(proId: string, startDate: Date, endDate: Date) {
  const bookings = await prisma.booking.findMany({
    where: {
      proId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      title: true,
      price: true,
    },
  })

  const serviceStats: { [key: string]: { bookings: number; revenue: number } } = {}
  
  bookings.forEach((booking: any) => {
    const service = booking.title || 'Unknown Service'
    if (!serviceStats[service]) {
      serviceStats[service] = { bookings: 0, revenue: 0 }
    }
    serviceStats[service].bookings += 1
    serviceStats[service].revenue += booking.price
  })

  return Object.entries(serviceStats)
    .map(([service, stats]) => ({
      service,
      bookings: stats.bookings,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.bookings - a.bookings)
}
