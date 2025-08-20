import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const offset = (page - 1) * limit

    // Find the appointment first
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        proId: true,
        clientId: true,
        title: true
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Verify user is involved in this appointment
    const isParticipant = appointment.proId === session.user.id || appointment.clientId === session.user.id
    
    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get status history
    const [history, totalCount] = await Promise.all([
      prisma.appointmentStatusHistory.findMany({
        where: { appointmentId },
        include: {
          changedByUser: {
            select: {
              id: true,
              username: true,
              avatar: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.appointmentStatusHistory.count({
        where: { appointmentId }
      })
    ])

    // Format the response
    const formattedHistory = history.map(entry => ({
      id: entry.id,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      reason: entry.reason,
      metadata: entry.metadata,
      createdAt: entry.createdAt,
      changedBy: {
        id: entry.changedByUser.id,
        username: entry.changedByUser.username,
        avatar: entry.changedByUser.avatar,
        role: entry.changedByUser.role
      }
    }))

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        title: appointment.title
      },
      history: formattedHistory,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page * limit < totalCount,
        hasPreviousPage: page > 1
      }
    })

  } catch (error) {
    console.error("Error fetching appointment history:", error)
    return NextResponse.json({ 
      error: "Failed to fetch appointment history" 
    }, { status: 500 })
  }
}
