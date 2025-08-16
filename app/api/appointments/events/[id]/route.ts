import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { params } = await context
    const { id: eventId } = await params

    // Récupérer l'événement avec toutes les relations
    const event = await prisma.appointment.findUnique({
      where: { id: eventId },
      include: {
        client: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
            phone: true
          }
        },
        pro: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            businessName: true,
            businessAddress: true,
            phone: true,
            email: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            stripePaymentIntentId: true,
            description: true,
            paidAt: true,
            refundedAt: true,
            refundAmount: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Vérifier que l'utilisateur a accès à cet événement
    if (event.clientId !== session.user.id && event.proId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Transformer les données pour le frontend
    const transformedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      duration: event.duration,
      price: event.price,
      currency: event.currency,
      location: event.location,
      status: event.status,
      type: event.type,
      notes: event.notes,
      requirements: event.requirements,
      cancellationPolicy: event.cancellationPolicy,
      depositRequired: event.depositRequired,
      depositAmount: event.depositAmount,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      client: event.client,
      pro: event.pro,
      payments: event.payments.map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        description: payment.description,
        paidAt: payment.paidAt?.toISOString(),
        refundedAt: payment.refundedAt?.toISOString(),
        refundAmount: payment.refundAmount
      }))
    }

    return NextResponse.json({
      success: true,
      event: transformedEvent
    })

  } catch (error) {
    console.error("Error fetching event details:", error)
    return NextResponse.json({ error: "Failed to fetch event details" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { params } = await context
    const { id: eventId } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'cancel') {
      // Annuler l'événement
      const event = await prisma.appointment.findUnique({
        where: { id: eventId },
        include: { client: true, pro: true }
      })

      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }

      // Vérifier que l'utilisateur peut annuler cet événement
      if (event.clientId !== session.user.id && event.proId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }

      if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
        return NextResponse.json({ error: "Event cannot be cancelled" }, { status: 400 })
      }

      // Mettre à jour le statut
      await prisma.appointment.update({
        where: { id: eventId },
        data: { status: 'CANCELLED' }
      })

      // Créer une notification pour l'autre participant
      const otherUserId = event.clientId === session.user.id ? event.proId : event.clientId
      await prisma.notification.create({
        data: {
          type: 'BOOKING',
          title: 'Événement annulé',
          message: `L'événement "${event.title}" a été annulé.`,
          userId: otherUserId,
          data: { eventId, cancelledBy: session.user.id }
        }
      })

      return NextResponse.json({
        success: true,
        message: "Event cancelled successfully"
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Error processing event action:", error)
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 })
  }
}
