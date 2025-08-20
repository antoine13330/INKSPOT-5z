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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: appointmentId } = await params

    // Récupérer l'appointment avec ses paiements
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        payments: {
          orderBy: { createdAt: 'asc' }
        },
        client: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        pro: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Vérifier que l'utilisateur peut voir cet appointment
    if (session.user.id !== appointment.clientId && session.user.id !== appointment.proId) {
      return NextResponse.json({ error: "Not authorized to view this appointment" }, { status: 403 })
    }

    // Calculer les totaux
    const totalPaid = appointment.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0)

    const remainingAmount = appointment.price - totalPaid

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        title: appointment.title,
        price: appointment.price,
        status: appointment.status,
        totalPaid,
        remainingAmount
      },
      payments: appointment.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        description: payment.description,
        createdAt: payment.createdAt,
        senderId: payment.senderId,
        receiverId: payment.receiverId
      })),
      client: appointment.client,
      pro: appointment.pro
    })

  } catch (error) {
    console.error("Error fetching appointment payments:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointment payments" },
      { status: 500 }
    )
  }
}
