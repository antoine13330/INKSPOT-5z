import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Récupérer le planning des disponibilités
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ proId: string }> }
) {
  const { proId } = await params
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    if (!start || !end) {
      return NextResponse.json({ error: "Start and end dates required" }, { status: 400 })
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    // Récupérer les disponibilités existantes
    const availabilities = await prisma.availability.findMany({
      where: {
        proId: proId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    })

    // Récupérer les rendez-vous existants pour vérifier les conflits
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
        status: true,
      },
    })

    // Construire le planning
    const schedule: Record<string, any> = {}
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0]
            const existingAvailability = availabilities.find((av: any) =>
        av.date.toISOString().split("T")[0] === dateKey
      )

            // Vérifier les conflits avec les rendez-vous
      const dayAppointments = appointments.filter((apt: any) =>
        apt.startDate.toISOString().split("T")[0] === dateKey
      )

      const blockedHours: string[] = []
      dayAppointments.forEach((apt: any) => {
        const startHour = apt.startDate.getHours().toString().padStart(2, "0") + ":00"
        const endHour = apt.endDate.getHours().toString().padStart(2, "0") + ":00"
        blockedHours.push(`${startHour}-${endHour}`)
      })

      schedule[dateKey] = {
        date: dateKey,
        isAvailable: existingAvailability?.isAvailable ?? true,
        timeSlots: existingAvailability?.timeSlots || [],
        blockedHours,
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return NextResponse.json({
      success: true,
      schedule,
    })

  } catch (error) {
    console.error("Error fetching availability schedule:", error)
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 })
  }
}

// Mettre à jour le planning des disponibilités
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ proId: string }> }
) {
  const { proId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== "PRO") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Vérifier que le PRO modifie ses propres disponibilités
    if (session.user.id !== proId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { schedule } = await request.json()

    if (!schedule || typeof schedule !== "object") {
      return NextResponse.json({ error: "Invalid schedule data" }, { status: 400 })
    }

    // Traiter chaque jour du planning
    for (const [dateKey, daySchedule] of Object.entries(schedule)) {
      const date = new Date(dateKey)
      
      // Vérifier que la date est valide
      if (isNaN(date.getTime())) {
        continue
      }

      // Mettre à jour ou créer la disponibilité
      await prisma.availability.upsert({
        where: {
          proId_date: {
            proId: proId,
            date: date,
          },
        },
        update: {
          isAvailable: (daySchedule as any).isAvailable,
          timeSlots: (daySchedule as any).timeSlots || [],
          updatedAt: new Date(),
        },
        create: {
          proId: proId,
          date: date,
          isAvailable: (daySchedule as any).isAvailable,
          timeSlots: (daySchedule as any).timeSlots || [],
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Schedule updated successfully",
    })

  } catch (error) {
    console.error("Error updating availability schedule:", error)
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 })
  }
}
