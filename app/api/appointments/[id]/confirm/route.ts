import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: appointmentId } = params

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
        },
        client: {
          select: {
            id: true,
            username: true
          }
        },
        payments: true
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Verify user is the PRO for this appointment
    if (appointment.proId !== session.user.id) {
      return NextResponse.json({ error: "Only the professional can confirm appointments" }, { status: 403 })
    }

    // Check current status
    if (!['ACCEPTED', 'CONFIRMED'].includes(appointment.status)) {
      return NextResponse.json({ 
        error: "Appointment must be accepted before confirmation" 
      }, { status: 400 })
    }

    // If deposit is required, check if it's paid
    if (appointment.depositRequired) {
      const depositPaid = appointment.payments.some(p => 
        p.status === 'COMPLETED' && (p.description || '').toLowerCase().includes('acompte')
      )
      
      if (!depositPaid) {
        return NextResponse.json({ 
          error: "Deposit must be paid before confirmation" 
        }, { status: 400 })
      }
    }

    // Update appointment status to CONFIRMED
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        status: 'CONFIRMED',
        updatedAt: new Date()
      }
    })

    // Create message in conversation
    let messageContent = `✅ **Rendez-vous confirmé !**\n\n`
    messageContent += `${session.user.username} a confirmé le rendez-vous "${appointment.title}".\n\n`
    messageContent += `📅 **Date**: ${new Date(appointment.startDate).toLocaleDateString('fr-FR')}\n`
    messageContent += `🕐 **Heure**: ${new Date(appointment.startDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n`
    
    if (appointment.location) {
      messageContent += `📍 **Lieu**: ${appointment.location}\n`
    }
    
    messageContent += `💰 **Prix**: ${appointment.price}€\n`
    
    if (appointment.depositRequired) {
      messageContent += `\n✨ L'acompte a été payé, le rendez-vous est maintenant définitif !`
    }

    // Extract conversation ID from notes
    const conversationMatch = appointment.notes?.match(/Conversation: (\w+)/)
    let conversationId: string | null = null
    
    if (conversationMatch) {
      conversationId = conversationMatch[1]
      
      await prisma.message.create({
        data: {
          content: messageContent,
          messageType: 'APPOINTMENT_CONFIRMATION',
          conversationId,
          senderId: session.user.id
        }
      })

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      })
    }

    // Create notification for client
    await prisma.notification.create({
      data: {
        title: "Rendez-vous confirmé !",
        message: `${session.user.username} a confirmé votre rendez-vous "${appointment.title}"`,
        type: "APPOINTMENT",
        userId: appointment.clientId,
        data: {
          appointmentId: appointment.id,
          type: "appointment_confirmed",
          proId: appointment.proId,
          conversationId
        }
      }
    })

    // Create status history entry
    await prisma.appointmentStatusHistory.create({
      data: {
        appointmentId: appointment.id,
        oldStatus: appointment.status,
        newStatus: 'CONFIRMED',
        changedBy: session.user.id,
        reason: 'Professional confirmation',
        metadata: {
          depositPaid: appointment.depositRequired,
          confirmedAt: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      success: true,
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        title: updatedAppointment.title,
        startDate: updatedAppointment.startDate,
        price: updatedAppointment.price,
        confirmedAt: updatedAppointment.updatedAt
      }
    })

  } catch (error) {
    console.error("Error confirming appointment:", error)
    return NextResponse.json({ 
      error: "Failed to confirm appointment" 
    }, { status: 500 })
  }
}
