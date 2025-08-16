import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ proId: string }> }
) {
  try {
    const { params } = await context
    const { proId } = await params
    
    // Récupérer les disponibilités pour les 30 prochains jours
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)

    // Récupérer les disponibilités configurées
    const availabilities = await prisma.availability.findMany({
      where: {
        proId: proId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        isAvailable: true,
      },
      orderBy: { date: "asc" },
    })

    // Récupérer les rendez-vous existants
    const appointments = await prisma.appointment.findMany({
      where: {
        proId: proId,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ["PROPOSED", "CONFIRMED", "IN_PROGRESS"],
        },
      },
      select: {
        startDate: true,
        endDate: true,
      },
    })

    // Générer la liste des dates disponibles
    const availableDates: string[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0]
      
      // Vérifier si la date est configurée comme disponible
      const availability = availabilities.find((av: any) => 
        av.date.toISOString().split("T")[0] === dateKey
      )

      if (availability && availability.isAvailable) {
        // Vérifier s'il y a des créneaux disponibles
        const dayAppointments = appointments.filter((apt: any) => 
          apt.startDate.toISOString().split("T")[0] === dateKey
        )

        // Si pas de rendez-vous ou des créneaux libres, la date est disponible
        if (dayAppointments.length === 0 || availability.timeSlots.length > 0) {
          availableDates.push(dateKey)
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json({
      success: true,
      dates: availableDates,
    })

  } catch (error) {
    console.error("Error fetching available dates:", error)
    return NextResponse.json({ error: "Failed to fetch available dates" }, { status: 500 })
  }
}
