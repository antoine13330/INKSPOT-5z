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
    const tab = searchParams.get('tab') || 'upcoming'
    const status = searchParams.get('status') || 'ALL'
    const type = searchParams.get('type') || 'ALL'

    // Construire les filtres
    const where: any = {}
    
    // Filtre par statut
    if (status !== 'ALL') {
      where.status = status
    }
    
    // Filtre par type
    if (type !== 'ALL') {
      where.type = type
    }

    // Filtre par date selon l'onglet
    const now = new Date()
    if (tab === 'upcoming') {
      where.startDate = { gt: now }
    } else if (tab === 'past') {
      where.startDate = { lt: now }
    }

    // Récupérer les événements selon le rôle de l'utilisateur
    let events
    if (session.user.role === 'PRO') {
      // Les PRO voient leurs rendez-vous en tant que professionnel
      events = await prisma.appointment.findMany({
        where: {
          ...where,
          proId: session.user.id
        },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true
            }
          },
          pro: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              businessName: true
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paidAt: true
            }
          }
        },
        orderBy: { startDate: 'asc' }
      })
    } else {
      // Les clients voient leurs rendez-vous en tant que client
      events = await prisma.appointment.findMany({
        where: {
          ...where,
          clientId: session.user.id
        },
        include: {
          client: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              email: true
            }
          },
          pro: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              businessName: true
            }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              paidAt: true
            }
          }
        },
        orderBy: { startDate: 'asc' }
      })
    }

    // Transformer les données pour le frontend
    const transformedEvents = events.map((event: any) => ({
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
        status: payment.status,
        paidAt: payment.paidAt?.toISOString()
      }))
    }))

    return NextResponse.json({
      success: true,
      events: transformedEvents,
      total: transformedEvents.length
    })

  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
