import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
// WebSocket désactivé - utiliser notifications push ou polling à la place

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: appointmentId } = await params
    const { action, selectedDateIndex } = await request.json()

    // Validate action
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Find the appointment
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        pro: {
          select: {
            id: true,
            username: true,
            businessName: true
          }
        }
      }
    })

    // Get conversation ID from appointment notes for now
    let conversationId: string | null = null
    if (appointment?.notes) {
      const match = appointment.notes.match(/Conversation: (\w+)/)
      if (match) {
        conversationId = match[1]
      }
    }

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Verify user is the client for this appointment
    if (appointment.clientId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to respond to this appointment" }, { status: 403 })
    }

    // Check if appointment is in PROPOSED status
    if (appointment.status !== 'PROPOSED') {
      return NextResponse.json({ error: "Appointment is not in proposed status" }, { status: 400 })
    }

    let updatedAppointment
    let messageContent = ""

    if (action === 'accept') {
      // Optionally select a proposed date from notes if provided
      let selectedStartDate: Date | null = null
      let selectedEndDate: Date | null = null
      try {
        if (typeof selectedDateIndex === 'number' && appointment.notes) {
          const match = appointment.notes.match(/ProposedDatesJSON: (\[.*\])/)
          if (match) {
            const proposed: string[] = JSON.parse(match[1])
            const start = new Date(proposed[selectedDateIndex])
            if (!isNaN(start.getTime())) {
              selectedStartDate = start
              selectedEndDate = new Date(start.getTime() + appointment.duration * 60000)
            }
          }
        }
      } catch (e) {
        // ignore parsing errors
      }

      // Update appointment status: if deposit is required, keep it in PROPOSED but lock onto selected slot,
      // otherwise mark as ACCEPTED.
      const nextStatus = appointment.depositRequired ? 'PROPOSED' : 'ACCEPTED'

      updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: nextStatus,
          ...(selectedStartDate && selectedEndDate
            ? {
                startDate: selectedStartDate,
                endDate: selectedEndDate,
              }
            : {}),
        }
      })

      messageContent = `✅ **Créneau sélectionné !**\n\n${session.user.username} a choisi un créneau pour "${appointment.title}".`
      if (appointment.depositRequired) {
        messageContent += `\n\n💳 **Étape suivante :** Paiement de la caution (${appointment.depositAmount}€) pour confirmer le rendez-vous.`
      } else {
        messageContent += `\n\n📅 **Proposition acceptée. Confirmation en cours.**`
      }
    } else {
      // Update appointment status to CANCELLED
      updatedAppointment = await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'CANCELLED'
        }
      })

      messageContent = `❌ **Proposition refusée**\n\n${session.user.username} a refusé la proposition de rendez-vous "${appointment.title}".`
    }

    // Create a message in the conversation to notify about the response
    if (conversationId) {
      await prisma.message.create({
        data: {
          content: messageContent,
          messageType: 'APPOINTMENT_RESPONSE',
          conversationId: conversationId,
          senderId: session.user.id
        }
      })

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
    }

    // Create notification for the PRO
    await prisma.notification.create({
      data: {
        title: action === 'accept' ? "Proposition acceptée !" : "Proposition refusée",
        message: action === 'accept' 
          ? `${session.user.username} a accepté votre proposition de rendez-vous "${appointment.title}"`
          : `${session.user.username} a refusé votre proposition de rendez-vous "${appointment.title}"`,
        type: "APPOINTMENT",
        userId: appointment.proId,
        data: {
          appointmentId: appointment.id,
          action,
          type: "appointment_response"
        }
      }
    })

    // WebSocket désactivé - utiliser notifications push ou polling à la place
    console.log(`Appointment response: ${action} for conversation ${conversationId}`)

    return NextResponse.json({
      success: true,
      message: action === 'accept' ? "Proposition acceptée avec succès" : "Proposition refusée",
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        title: updatedAppointment.title,
        depositRequired: updatedAppointment.depositRequired,
        depositAmount: updatedAppointment.depositAmount
      }
    })

  } catch (error) {
    console.error("Error responding to appointment:", error)
    return NextResponse.json({ 
      error: "Failed to respond to appointment" 
    }, { status: 500 })
  }
}
