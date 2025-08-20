import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
// WebSocket désactivé - utiliser notifications push ou polling à la place

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only PROs can propose appointments
    if (session.user.role !== 'PRO') {
      return NextResponse.json({ error: "Only professionals can propose appointments" }, { status: 403 })
    }

    const body = await request.json()
    const {
      conversationId,
      proId,
      clientId,
      postId,
      type,
      title,
      description,
      duration,
      price,
      currency,
      location,
      requirements,
      notes,
      proposedDates,
      depositRequired,
      depositAmount
    } = body

    // Validate required fields
    if (!conversationId || !clientId || !type || !title || !description || !price || !proposedDates?.length) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    // Verify the conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Verify the client exists
    const client = await prisma.user.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Create the appointment proposal with the first proposed date
    const firstProposedDate = new Date(proposedDates[0])
    const endDate = new Date(firstProposedDate.getTime() + duration * 60 * 1000) // duration in minutes

    const appointment = await prisma.appointment.create({
      data: {
        title,
        description,
        startDate: firstProposedDate,
        endDate: endDate,
        duration,
        price,
        currency: currency || 'EUR',
        location: location || '',
        status: 'PROPOSED', // Status for proposals
        type,
        notes: notes || '',
        requirements: Array.isArray(requirements) ? requirements.join(', ') : (requirements || ''),
        proId: session.user.id,
        clientId,
        depositRequired: depositRequired || false,
        depositAmount: depositAmount || 0
      }
    })

    // Store conversationId and proposed dates reference in the appointment notes
    const proposedDatesISO = proposedDates.map((d: string) => new Date(d).toISOString())
    const notesParts = [
      appointment.notes || "",
      `Conversation: ${conversationId}`,
      `ProposedDatesJSON: ${JSON.stringify(proposedDatesISO)}`
    ].filter(Boolean)

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { 
        notes: notesParts.join("\n")
      }
    })

    // Create a message in the conversation to notify about the proposal
    const proposalMessage = await prisma.message.create({
      data: {
        content: `📅 Proposition de rendez-vous: "${title}"\n\n🎨 Type: ${type}\n💰 Prix: ${price}€\n⏱️ Durée: ${duration} minutes\n\n${description}`,
        messageType: 'APPOINTMENT_PROPOSAL',
        conversationId,
        senderId: session.user.id
      }
    })

    // Mark conversation as active if it wasn't
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    })

    // Create notification for the client
    await prisma.notification.create({
      data: {
        title: "Nouvelle proposition de rendez-vous",
        message: `${session.user.username} vous a proposé un rendez-vous pour "${title}"`,
        type: "APPOINTMENT",
        userId: clientId,
        data: {
          appointmentId: appointment.id,
          conversationId,
          type: "appointment_proposal"
        }
      }
    })

    // WebSocket désactivé - utiliser notifications push ou polling à la place
    console.log(`New appointment proposal created for conversation ${conversationId}`)

    return NextResponse.json({
      success: true,
      message: "Proposition de rendez-vous envoyée avec succès",
      proposal: {
        id: appointment.id,
        title,
        type,
        price,
        currency,
        duration,
        proposedDates,
        status: 'PROPOSED'
      }
    })

  } catch (error) {
    console.error("Error creating appointment proposal:", error)
    return NextResponse.json({ 
      error: "Failed to create appointment proposal" 
    }, { status: 500 })
  }
}
