import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const userId = searchParams.get('userId') || session.user.id

    // Check if user can access stats for the requested user
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Build queries based on user role
    const isPro = session.user.role === 'PRO'
    const userFilter = isPro 
      ? { proId: userId }
      : { clientId: userId }

    // Get appointment counts by status
    const statusCounts = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        ...userFilter,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    })

    // Get total revenue (for PROs only)
    let revenueStats = null
    if (isPro) {
      const [totalRevenue, confirmedRevenue, pendingRevenue] = await Promise.all([
        // Total completed payments
        prisma.payment.aggregate({
          where: {
            receiverId: userId,
            status: 'COMPLETED',
            createdAt: {
              gte: startDate
            }
          },
          _sum: {
            amount: true
          }
        }),
        // Revenue from confirmed appointments
        prisma.appointment.aggregate({
          where: {
            proId: userId,
            status: 'CONFIRMED',
            createdAt: {
              gte: startDate
            }
          },
          _sum: {
            price: true
          }
        }),
        // Pending revenue (accepted but not confirmed)
        prisma.appointment.aggregate({
          where: {
            proId: userId,
            status: 'ACCEPTED',
            createdAt: {
              gte: startDate
            }
          },
          _sum: {
            price: true
          }
        })
      ])

      revenueStats = {
        totalReceived: totalRevenue._sum.amount || 0,
        confirmed: confirmedRevenue._sum.price || 0,
        pending: pendingRevenue._sum.price || 0
      }
    }

    // Get appointment trends (daily counts for the period)
    const trendData = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        ...userFilter,
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        status: 'asc'
      }
    })

    // Get recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      where: {
        ...userFilter,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        pro: {
          select: {
            id: true,
            username: true,
            businessName: true,
            avatar: true
          }
        },
        client: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        payments: {
          where: {
            status: 'COMPLETED'
          },
          select: {
            amount: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Calculate conversion rates (for PROs)
    let conversionStats = null
    if (isPro) {
      const [totalProposed, totalAccepted, totalConfirmed] = await Promise.all([
        prisma.appointment.count({
          where: {
            proId: userId,
            status: 'PROPOSED',
            createdAt: { gte: startDate }
          }
        }),
        prisma.appointment.count({
          where: {
            proId: userId,
            status: 'ACCEPTED',
            createdAt: { gte: startDate }
          }
        }),
        prisma.appointment.count({
          where: {
            proId: userId,
            status: 'CONFIRMED',
            createdAt: { gte: startDate }
          }
        })
      ])

      const totalProposals = totalProposed + totalAccepted + totalConfirmed
      conversionStats = {
        proposalToAccepted: totalProposals > 0 ? (totalAccepted + totalConfirmed) / totalProposals * 100 : 0,
        acceptedToConfirmed: totalAccepted > 0 ? totalConfirmed / totalAccepted * 100 : 0,
        overallConversion: totalProposals > 0 ? totalConfirmed / totalProposals * 100 : 0
      }
    }

    // Format status counts
    const formattedStatusCounts = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    // Calculate total appointments
    const totalAppointments = Object.values(formattedStatusCounts).reduce((sum, count) => sum + count, 0)

    return NextResponse.json({
      success: true,
      period: periodDays,
      dateRange: {
        from: startDate.toISOString(),
        to: new Date().toISOString()
      },
      summary: {
        totalAppointments,
        statusCounts: formattedStatusCounts,
        ...(revenueStats && { revenue: revenueStats }),
        ...(conversionStats && { conversion: conversionStats })
      },
      trends: trendData,
      recentAppointments: recentAppointments.map(apt => ({
        id: apt.id,
        title: apt.title,
        status: apt.status,
        price: apt.price,
        startDate: apt.startDate,
        createdAt: apt.createdAt,
        pro: apt.pro,
        client: apt.client,
        totalPaid: apt.payments.reduce((sum, p) => sum + p.amount, 0),
        lastPayment: apt.payments.length > 0 ? apt.payments[apt.payments.length - 1].createdAt : null
      }))
    })

  } catch (error) {
    console.error("Error fetching appointment stats:", error)
    return NextResponse.json({ 
      error: "Failed to fetch appointment stats" 
    }, { status: 500 })
  }
}

