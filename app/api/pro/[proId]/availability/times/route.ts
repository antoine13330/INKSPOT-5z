import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ proId: string }> }
) {
  const { proId } = await params
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date parameter required" }, { status: 400 })
    }

    const targetDate = new Date(date)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }

    // Récupérer la disponibilité configurée pour cette date
    const availability = await prisma.availability.findUnique({
      where: {
        proId_date: {
          proId: proId,
          date: targetDate,
        },
      },
    })

    // Si la date n'est pas disponible, retourner une liste vide
    if (!availability || !availability.isAvailable) {
      return NextResponse.json({
        success: true,
        timeSlots: [],
      })
    }

    // Récupérer les rendez-vous existants pour cette date
    const appointments = await prisma.appointment.findMany({
      where: {
        proId: proId,
        startDate: {
          gte: targetDate,
          lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
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

    // Créer des créneaux de 1 heure de 9h à 18h
    const timeSlots: Array<{ time: string; available: boolean }> = []
    const startHour = 9
    const endHour = 18

    for (let hour = startHour; hour < endHour; hour++) {
      const timeStr = hour.toString().padStart(2, "0") + ":00"
      const slotStart = new Date(targetDate)
      slotStart.setHours(hour, 0, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000)

      // Vérifier s'il y a un conflit avec un rendez-vous existant
      const hasConflict = appointments.some((apt: any) => {
        return (
          (slotStart >= apt.startDate && slotStart < apt.endDate) ||
          (slotEnd > apt.startDate && slotEnd <= apt.endDate) ||
          (slotStart <= apt.startDate && slotEnd >= apt.endDate)
        )
      })

      // Vérifier si le créneau est dans les créneaux configurés
      const isInConfiguredSlots = availability.timeSlots.some((slot: any) => {
        if (!slot || typeof slot !== 'object' || !slot.available) return false
        
        const slotStartTime = new Date(`2000-01-01T${slot.startTime}`)
        const slotEndTime = new Date(`2000-01-01T${slot.endTime}`)
        const currentSlotStart = new Date(`2000-01-01T${timeStr}`)
        const currentSlotEnd = new Date(`2000-01-01T${(hour + 1).toString().padStart(2, "0")}:00`)
        
        return (
          (currentSlotStart >= slotStartTime && currentSlotStart < slotEndTime) ||
          (currentSlotEnd > slotStartTime && currentSlotEnd <= slotEndTime) ||
          (currentSlotStart <= slotStartTime && currentSlotEnd >= slotEndTime)
        )
      })

      // Le créneau est disponible s'il n'y a pas de conflit ET qu'il est dans les créneaux configurés
      const isAvailable = !hasConflict && isInConfiguredSlots

      timeSlots.push({
        time: timeStr,
        available: isAvailable,
      })
    }

    return NextResponse.json({
      success: true,
      timeSlots,
    })

  } catch (error) {
    console.error("Error fetching available time slots:", error)
    return NextResponse.json({ error: "Failed to fetch time slots" }, { status: 500 })
  }
}
