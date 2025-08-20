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
    const otherUserId = searchParams.get('otherUserId')

    if (!otherUserId) {
      return NextResponse.json({ error: "otherUserId is required" }, { status: 400 })
    }

    // Find the latest active appointment between current user and other user
    const latestActiveAppointment = await prisma.appointment.findFirst({
      where: {
        OR: [
          { proId: session.user.id, clientId: otherUserId },
          { proId: otherUserId, clientId: session.user.id }
        ],
        status: {
          notIn: ['CANCELLED', 'COMPLETED'] // Exclure les appointments terminés
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        payments: {
          select: {
            status: true,
            amount: true
          }
        }
      }
    })

    if (!latestActiveAppointment) {
      return NextResponse.json({ 
        hasAppointment: false,
        canPropose: session.user.role === 'PRO'
      })
    }

    // Calculate payment status
    const depositPaid = latestActiveAppointment.payments.some(p => p.status === 'COMPLETED')
    const fullPayment = latestActiveAppointment.payments.reduce((sum, p) => 
      p.status === 'COMPLETED' ? sum + p.amount : sum, 0
    ) >= latestActiveAppointment.price

    return NextResponse.json({
      hasAppointment: true,
      appointment: {
        id: latestActiveAppointment.id,
        title: latestActiveAppointment.title,
        description: latestActiveAppointment.description,
        status: latestActiveAppointment.status,
        price: latestActiveAppointment.price,
        duration: latestActiveAppointment.duration,
        currency: latestActiveAppointment.currency,
        location: latestActiveAppointment.location,
        notes: latestActiveAppointment.notes,
        depositRequired: latestActiveAppointment.depositRequired,
        depositAmount: latestActiveAppointment.depositAmount,
        depositPaid,
        fullPayment,
        isProposer: latestActiveAppointment.proId === session.user.id,
        startDate: latestActiveAppointment.startDate.toISOString()
      },
      canPropose: false // Il y a déjà un appointment actif, pas besoin de proposer
    })

  } catch (error) {
    console.error("Error fetching appointment status:", error)
    return NextResponse.json({ error: "Failed to fetch appointment status" }, { status: 500 })
  }
}
