import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
// WebSocket désactivé - utiliser notifications push ou polling à la place

export const dynamic = "force-dynamic"

// Valid status transitions
const VALID_TRANSITIONS = {
  PROPOSED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'RESCHEDULED'],
  COMPLETED: ['CANCELLED'], // Only for admin/special cases
  CANCELLED: [], // Terminal state
  RESCHEDULED: ['PROPOSED', 'CANCELLED'] // Back to proposal or cancelled
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: appointmentId } = await params
    const { status: newStatus, reason, metadata } = await request.json()

    if (!newStatus) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
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

    // Verify user is involved in this appointment (PRO or CLIENT)
    const isParticipant = appointment.proId === session.user.id || appointment.clientId === session.user.id
    const isPro = appointment.proId === session.user.id
    
    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if transition is valid
    const currentStatus = appointment.status
    const validTransitions = VALID_TRANSITIONS[currentStatus as keyof typeof VALID_TRANSITIONS] || []
    
    if (!(validTransitions as string[]).includes(newStatus)) {
      return NextResponse.json({ 
        error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        validTransitions 
      }, { status: 400 })
    }

    // Role-based permissions for status changes
    const statusChangePermissions = {
      ACCEPTED: ['client'], // Only client can accept
      CONFIRMED: ['pro'], // Only pro can confirm
      CANCELLED: ['pro', 'client'], // Both can cancel
      COMPLETED: ['pro'], // Only pro can mark complete
      RESCHEDULED: ['pro', 'client'] // Both can request reschedule
    }

    const userRole = isPro ? 'pro' : 'client'
    const allowedRoles = statusChangePermissions[newStatus as keyof typeof statusChangePermissions] || []
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ 
        error: `Only ${allowedRoles.join(' or ')} can set status to ${newStatus}` 
      }, { status: 403 })
    }

    // Special validations for certain status changes
    if (newStatus === 'CONFIRMED') {
      // Check if deposit is required and paid
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
    }

    if (newStatus === 'COMPLETED') {
      // Check if full payment is received
      const totalPaid = appointment.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0)
      
      if (totalPaid < appointment.price) {
        return NextResponse.json({ 
          error: "Full payment must be received before marking as completed" 
        }, { status: 400 })
      }
    }

    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      }
    })

    // Create status history entry
    await prisma.appointmentStatusHistory.create({
      data: {
        appointmentId: appointment.id,
        oldStatus: currentStatus,
        newStatus,
        changedBy: session.user.id,
        reason: reason || `Status changed to ${newStatus}`,
        metadata: metadata || {}
      }
    })

    // Generate appropriate message content
    let messageContent = ""
    const userName = session.user.username
    const appointmentTitle = appointment.title

    switch (newStatus) {
      case 'CANCELLED':
        messageContent = `❌ **Rendez-vous annulé**\n\n${userName} a annulé le rendez-vous "${appointmentTitle}".`
        if (reason) {
          messageContent += `\n\n**Raison**: ${reason}`
        }
        break
      
      case 'COMPLETED':
        messageContent = `✅ **Rendez-vous terminé !**\n\n${userName} a marqué le rendez-vous "${appointmentTitle}" comme terminé.`
        break
      
      case 'RESCHEDULED':
        messageContent = `📅 **Demande de report**\n\n${userName} souhaite reporter le rendez-vous "${appointmentTitle}".`
        if (reason) {
          messageContent += `\n\n**Raison**: ${reason}`
        }
        break
      
      default:
        messageContent = `🔄 **Statut mis à jour**\n\n${userName} a changé le statut du rendez-vous "${appointmentTitle}" en: **${newStatus}**`
    }

    // Send message to conversation
    const conversationMatch = appointment.notes?.match(/Conversation: (\w+)/)
    let conversationId: string | null = null
    
    if (conversationMatch) {
      conversationId = conversationMatch[1]
      
      await prisma.message.create({
        data: {
          content: messageContent,
          messageType: 'APPOINTMENT_STATUS_CHANGE',
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

    // Create notification for the other party
    const otherUserId = isPro ? appointment.clientId : appointment.proId
    
    await prisma.notification.create({
      data: {
        title: `Rendez-vous ${newStatus.toLowerCase()}`,
        message: `${userName} a modifié le statut de votre rendez-vous "${appointmentTitle}"`,
        type: "APPOINTMENT",
        userId: otherUserId,
        data: {
          appointmentId: appointment.id,
          type: "status_changed",
          newStatus,
          changedBy: session.user.id,
          conversationId
        }
      }
    })

    // WebSocket désactivé - utiliser notifications push ou polling à la place
    console.log(`Appointment status changed to ${newStatus} for conversation ${conversationId}`)

    return NextResponse.json({
      success: true,
      appointment: {
        id: updatedAppointment.id,
        status: updatedAppointment.status,
        title: updatedAppointment.title,
        previousStatus: currentStatus,
        changedBy: userName,
        changedAt: updatedAppointment.updatedAt
      }
    })

  } catch (error) {
    console.error("Error updating appointment status:", error)
    return NextResponse.json({ 
      error: "Failed to update appointment status" 
    }, { status: 500 })
  }
}

// GET endpoint to retrieve status information and valid transitions
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: appointmentId } = await params

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
        payments: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            changedByUser: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Verify user is involved in this appointment
    const isParticipant = appointment.proId === session.user.id || appointment.clientId === session.user.id
    
    if (!isParticipant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const isPro = appointment.proId === session.user.id
    const currentStatus = appointment.status
    
    // Get valid transitions for current user
    const allValidTransitions = VALID_TRANSITIONS[currentStatus as keyof typeof VALID_TRANSITIONS] || []
    const userRole = isPro ? 'pro' : 'client'
    
    const statusPermissions: Record<string, string[]> = {
      ACCEPTED: ['client'],
      CONFIRMED: ['pro'],
      CANCELLED: ['pro', 'client'],
      COMPLETED: ['pro'],
      RESCHEDULED: ['pro', 'client']
    }
    
    const validTransitions = allValidTransitions.filter(status => {
      const allowedRoles = statusPermissions[status] || []
      return allowedRoles.includes(userRole)
    })

    // Calculate payment status
    const depositPaid = appointment.payments.some((p: any) => 
      p.status === 'COMPLETED' && (p.description || '').toLowerCase().includes('acompte')
    )
    
    const totalPaid = appointment.payments
      .filter((p: any) => p.status === 'COMPLETED')
      .reduce((sum: number, p: any) => sum + p.amount, 0)
    
    const fullPayment = totalPaid >= appointment.price

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        title: appointment.title,
        status: currentStatus,
        depositRequired: appointment.depositRequired,
        depositPaid,
        fullPayment,
        totalPaid,
        price: appointment.price
      },
      permissions: {
        isPro,
        canModify: isParticipant,
        validTransitions
      },
      statusHistory: appointment.statusHistory
    })

  } catch (error) {
    console.error("Error fetching appointment status:", error)
    return NextResponse.json({ 
      error: "Failed to fetch appointment status" 
    }, { status: 500 })
  }
}
