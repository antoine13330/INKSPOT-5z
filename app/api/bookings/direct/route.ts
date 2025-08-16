import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { proId, serviceId, date, time, notes } = await request.json()

    if (!proId || !serviceId || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Vérifier que l'utilisateur ne réserve pas pour lui-même
    if (session.user.id === proId) {
      return NextResponse.json({ error: "Cannot book yourself" }, { status: 400 })
    }

    // Vérifier que le PRO existe et est actif
    const pro = await prisma.user.findUnique({
      where: { 
        id: proId,
        role: 'PRO',
        status: 'ACTIVE'
      },
    })

    if (!pro) {
      return NextResponse.json({ error: "Professional not found or inactive" }, { status: 404 })
    }

    // Vérifier que le service existe
    const service = await prisma.service.findUnique({
      where: { 
        id: serviceId,
        proId: proId
      },
    })

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    // Vérifier la disponibilité
    const startDateTime = new Date(`${date}T${time}`)
    const endDateTime = new Date(startDateTime.getTime() + service.duration * 60 * 1000)

    // Vérifier qu'il n'y a pas de conflit avec d'autres rendez-vous
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        proId,
        status: {
          in: ['PROPOSED', 'CONFIRMED', 'IN_PROGRESS']
        },
        OR: [
          {
            startDate: {
              lt: endDateTime,
              gte: startDateTime
            }
          },
          {
            endDate: {
              gt: startDateTime,
              lte: endDateTime
            }
          }
        ]
      }
    })

    if (conflictingAppointments.length > 0) {
      return NextResponse.json({ error: "Time slot not available" }, { status: 409 })
    }

    // Créer le rendez-vous
    const appointment = await prisma.appointment.create({
      data: {
        title: `Réservation - ${service.name}`,
        description: notes || `Réservation directe pour ${service.name}`,
        startDate: startDateTime,
        endDate: endDateTime,
        duration: service.duration,
        price: service.price,
        currency: 'EUR',
        status: 'PROPOSED',
        type: service.type || 'OTHER',
        proId,
        clientId: session.user.id,
        notes: notes || undefined,
      },
      include: {
        pro: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            businessName: true,
            email: true,
          }
        },
        client: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    })

    // Créer une notification pour le PRO
    await prisma.notification.create({
      data: {
        title: "Nouvelle réservation directe",
        message: `@${session.user.username} a réservé ${service.name} le ${new Date(date).toLocaleDateString('fr-FR')} à ${time}`,
        type: "BOOKING",
        userId: proId,
        data: {
          appointmentId: appointment.id,
          serviceName: service.name,
          clientUsername: session.user.username,
          date,
          time,
          actionUrl: `/profile/appointments`,
        },
      },
    })

    // Créer une notification pour le client
    await prisma.notification.create({
      data: {
        title: "Réservation confirmée",
        message: `Votre réservation pour ${service.name} a été créée avec succès`,
        type: "BOOKING",
        userId: session.user.id,
        data: {
          appointmentId: appointment.id,
          serviceName: service.name,
          proUsername: pro.username,
          date,
          time,
          actionUrl: `/profile/events/${appointment.id}`,
        },
      },
    })

    return NextResponse.json({
      success: true,
      booking: {
        id: appointment.id,
        title: appointment.title,
        startDate: appointment.startDate.toISOString(),
        endDate: appointment.endDate.toISOString(),
        status: appointment.status,
        price: appointment.price,
        currency: appointment.currency,
        service: {
          id: service.id,
          name: service.name,
          duration: service.duration,
        },
        pro: appointment.pro,
        client: appointment.client,
      },
    })

  } catch (error) {
    console.error("Error creating direct booking:", error)
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
