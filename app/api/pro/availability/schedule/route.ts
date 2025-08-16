import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET: Get professional's availability schedule
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const proId = searchParams.get("proId") || session.user.id
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Check if user can access this data
    const isAdmin = session.user.role === "ADMIN"
    const isPro = session.user.id === proId

    if (!isAdmin && !isPro) {
      return NextResponse.json({ message: "Not authorized to view this data" }, { status: 403 })
    }

    // Get availability schedule
    const where: any = { proId }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const availability = await prisma.availabilitySchedule.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        timeSlots: {
          orderBy: { startTime: "asc" },
        },
      },
    })

    return NextResponse.json({ availability })
  } catch (error) {
    console.error("Error fetching availability:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// POST: Create or update availability schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { date, timeSlots, isAvailable = true, notes } = body

    if (!date || !timeSlots || !Array.isArray(timeSlots)) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Verify the user is a PRO
    if (session.user.role !== "PRO") {
      return NextResponse.json({ message: "Only professionals can set availability" }, { status: 403 })
    }

    const scheduleDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Don't allow setting availability for past dates
    if (scheduleDate < today) {
      return NextResponse.json({ message: "Cannot set availability for past dates" }, { status: 400 })
    }

    // Check for existing schedule
    const existingSchedule = await prisma.availabilitySchedule.findFirst({
      where: {
        proId: session.user.id,
        date: scheduleDate,
      },
    })

    if (existingSchedule) {
      // Update existing schedule
      await prisma.availabilitySchedule.update({
        where: { id: existingSchedule.id },
        data: {
          isAvailable,
          notes,
          updatedAt: new Date(),
        },
      })

      // Delete existing time slots
      await prisma.availabilityTimeSlot.deleteMany({
        where: { scheduleId: existingSchedule.id },
      })
    } else {
      // Create new schedule
      await prisma.availabilitySchedule.create({
        data: {
          proId: session.user.id,
          date: scheduleDate,
          isAvailable,
          notes,
        },
      })
    }

    // Get the schedule ID (either existing or newly created)
    const schedule = await prisma.availabilitySchedule.findFirst({
      where: {
        proId: session.user.id,
        date: scheduleDate,
      },
    })

    if (!schedule) {
      return NextResponse.json({ message: "Failed to create schedule" }, { status: 500 })
    }

    // Create time slots
    const timeSlotData = timeSlots.map((slot: any) => ({
      scheduleId: schedule.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable !== false,
      maxBookings: slot.maxBookings || 1,
      price: slot.price,
      notes: slot.notes,
    }))

    await prisma.availabilityTimeSlot.createMany({
      data: timeSlotData,
    })

    // Get updated schedule with time slots
    const updatedSchedule = await prisma.availabilitySchedule.findUnique({
      where: { id: schedule.id },
      include: {
        timeSlots: {
          orderBy: { startTime: "asc" },
        },
      },
    })

    return NextResponse.json({
      message: "Availability schedule updated successfully",
      schedule: updatedSchedule,
    })
  } catch (error) {
    console.error("Error updating availability:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Remove availability for a specific date
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ message: "Date parameter is required" }, { status: 400 })
    }

    // Verify the user is a PRO
    if (session.user.role !== "PRO") {
      return NextResponse.json({ message: "Only professionals can manage availability" }, { status: 403 })
    }

    const scheduleDate = new Date(date)

    // Delete schedule and all associated time slots
    await prisma.availabilitySchedule.deleteMany({
      where: {
        proId: session.user.id,
        date: scheduleDate,
      },
    })

    return NextResponse.json({ message: "Availability removed successfully" })
  } catch (error) {
    console.error("Error removing availability:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
