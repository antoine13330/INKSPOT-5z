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
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit
    const search = searchParams.get('search')

    // Build filter based on user role
    const isPro = session.user.role === 'PRO'
    const where: any = {}

    if (isPro) {
      where.proId = session.user.id
    } else {
      where.clientId = session.user.id
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      where.status = status
    }

    // Add search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          client: {
            username: { contains: search, mode: 'insensitive' }
          }
        },
        {
          pro: {
            username: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    // Get appointments and total count
    const [appointments, totalCount] = await Promise.all([
      prisma.appointment.findMany({
        where,
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
              createdAt: true,
              description: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.appointment.count({ where })
    ])

    // Format appointments with payment info
    const formattedAppointments = appointments.map(appointment => {
      const totalPaid = appointment.payments.reduce((sum, payment) => sum + payment.amount, 0)
      const lastPayment = appointment.payments.length > 0 
        ? appointment.payments[appointment.payments.length - 1].createdAt 
        : null

      // Calculate payment status
      const depositPaid = appointment.depositRequired 
        ? appointment.payments.some(p => p.description?.includes('acompte'))
        : true // No deposit required means it's "paid"
      
      const fullPayment = totalPaid >= appointment.price

      return {
        id: appointment.id,
        title: appointment.title,
        description: appointment.description,
        status: appointment.status,
        price: appointment.price,
        currency: appointment.currency,
        startDate: appointment.startDate,
        endDate: appointment.endDate,
        location: appointment.location,
        depositRequired: appointment.depositRequired,
        depositAmount: appointment.depositAmount,
        totalPaid,
        depositPaid,
        fullPayment,
        pro: appointment.pro,
        client: appointment.client,
        lastPayment,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      }
    })

    return NextResponse.json({
      success: true,
      appointments: formattedAppointments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1
      },
      filters: {
        status,
        search,
        userRole: isPro ? 'pro' : 'client'
      }
    })

  } catch (error) {
    console.error("Error fetching appointments list:", error)
    return NextResponse.json({ 
      error: "Failed to fetch appointments" 
    }, { status: 500 })
  }
}

