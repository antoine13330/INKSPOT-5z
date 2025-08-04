import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { paymentId, reason, description, evidence } = await request.json()

    if (!paymentId || !reason) {
      return NextResponse.json({ message: "Payment ID and reason are required" }, { status: 400 })
    }

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        sender: true,
        receiver: true,
        booking: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 })
    }

    // Check if user has permission to dispute this payment
    const isAuthorized = 
      payment.senderId === session.user.id || // Payment sender can dispute
      session.user.role === "ADMIN" // Admin can manage disputes

    if (!isAuthorized) {
      return NextResponse.json({ message: "Not authorized to dispute this payment" }, { status: 403 })
    }

    // Check if payment can be disputed
    if (payment.status !== "COMPLETED") {
      return NextResponse.json({ message: "Only completed payments can be disputed" }, { status: 400 })
    }

    // Check if dispute already exists
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        paymentId: payment.id,
        status: {
          not: "RESOLVED",
        },
      },
    })

    if (existingDispute) {
      return NextResponse.json({ message: "A dispute for this payment already exists" }, { status: 400 })
    }

    // Create dispute record
    const dispute = await prisma.dispute.create({
      data: {
        paymentId: payment.id,
        reason,
        description: description || "",
        status: "OPEN",
        disputantId: session.user.id,
        respondentId: payment.senderId === session.user.id ? payment.receiverId : payment.senderId,
      },
      include: {
        payment: {
          include: {
            sender: true,
            receiver: true,
            booking: true,
          },
        },
        disputant: true,
        respondent: true,
      },
    })

    // If evidence is provided, create evidence records
    if (evidence && evidence.length > 0) {
      await Promise.all(
        evidence.map((item: any) =>
          prisma.disputeEvidence.create({
            data: {
              disputeId: dispute.id,
              type: item.type,
              description: item.description,
              fileUrl: item.fileUrl,
              submittedById: session.user.id,
            },
          })
        )
      )
    }

    // Create notifications for all parties
    await Promise.all([
      prisma.notification.create({
        data: {
          title: "Dispute Created",
          message: `A dispute has been created for payment of €${payment.amount}`,
          type: "DISPUTE",
          userId: dispute.disputantId,
          data: {
            disputeId: dispute.id,
            paymentId: payment.id,
            type: "dispute_created",
          },
        },
      }),
      prisma.notification.create({
        data: {
          title: "Payment Disputed",
          message: `Your payment of €${payment.amount} has been disputed`,
          type: "DISPUTE",
          userId: dispute.respondentId,
          data: {
            disputeId: dispute.id,
            paymentId: payment.id,
            type: "dispute_received",
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      dispute,
    })
  } catch (error) {
    console.error("Error creating dispute:", error)
    return NextResponse.json(
      { message: "Failed to create dispute", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const userId = url.searchParams.get("userId") || session.user.id

    // Check if user can access this data
    const isAdmin = session.user.role === "ADMIN"
    const isOwner = session.user.id === userId

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Not authorized to view this data" }, { status: 403 })
    }

    let whereClause: any = {}

    if (isAdmin) {
      // Admin can see all disputes
      if (status) {
        whereClause.status = status.toUpperCase()
      }
    } else {
      // Users can only see their own disputes
      whereClause = {
        OR: [
          { disputantId: userId },
          { respondentId: userId },
        ],
      }
      
      if (status) {
        whereClause.status = status.toUpperCase()
      }
    }

    const disputes = await prisma.dispute.findMany({
      where: whereClause,
      include: {
        payment: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            booking: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        disputant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        evidence: {
          include: {
            submittedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      disputes,
    })
  } catch (error) {
    console.error("Error fetching disputes:", error)
    return NextResponse.json(
      { message: "Failed to fetch disputes" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { disputeId, action, resolution, evidence } = await request.json()

    if (!disputeId || !action) {
      return NextResponse.json({ message: "Dispute ID and action are required" }, { status: 400 })
    }

    // Find the dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        payment: true,
        disputant: true,
        respondent: true,
      },
    })

    if (!dispute) {
      return NextResponse.json({ message: "Dispute not found" }, { status: 404 })
    }

    // Check permissions
    const isParty = dispute.disputantId === session.user.id || dispute.respondentId === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isParty && !isAdmin) {
      return NextResponse.json({ message: "Not authorized to modify this dispute" }, { status: 403 })
    }

    let updatedDispute

    switch (action) {
      case "submit_evidence":
        if (!evidence) {
          return NextResponse.json({ message: "Evidence is required" }, { status: 400 })
        }

        // Add evidence
        await prisma.disputeEvidence.create({
          data: {
            disputeId: dispute.id,
            type: evidence.type,
            description: evidence.description,
            fileUrl: evidence.fileUrl,
            submittedById: session.user.id,
          },
        })

        // Update dispute status if needed
        if (dispute.status === "WAITING_FOR_EVIDENCE") {
          updatedDispute = await prisma.dispute.update({
            where: { id: disputeId },
            data: { status: "UNDER_REVIEW" },
          })
        }

        break

      case "respond":
        if (!isParty) {
          return NextResponse.json({ message: "Only dispute parties can respond" }, { status: 403 })
        }

        updatedDispute = await prisma.dispute.update({
          where: { id: disputeId },
          data: {
            response: resolution,
            status: "UNDER_REVIEW",
          },
        })

        break

      case "resolve":
        if (!isAdmin) {
          return NextResponse.json({ message: "Only admins can resolve disputes" }, { status: 403 })
        }

        updatedDispute = await prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: "RESOLVED",
            resolution,
            resolvedAt: new Date(),
            resolvedById: session.user.id,
          },
        })

        // Create notifications
        await Promise.all([
          prisma.notification.create({
            data: {
              title: "Dispute Resolved",
              message: `Your dispute has been resolved: ${resolution}`,
              type: "DISPUTE",
              userId: dispute.disputantId,
              data: {
                disputeId: dispute.id,
                resolution,
                type: "dispute_resolved",
              },
            },
          }),
          prisma.notification.create({
            data: {
              title: "Dispute Resolved",
              message: `A dispute against you has been resolved: ${resolution}`,
              type: "DISPUTE",
              userId: dispute.respondentId,
              data: {
                disputeId: dispute.id,
                resolution,
                type: "dispute_resolved",
              },
            },
          }),
        ])

        break

      case "close":
        if (!isParty && !isAdmin) {
          return NextResponse.json({ message: "Not authorized to close this dispute" }, { status: 403 })
        }

        updatedDispute = await prisma.dispute.update({
          where: { id: disputeId },
          data: {
            status: "CLOSED",
          },
        })

        break

      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    // Get updated dispute with full details
    const finalDispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        payment: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        disputant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        evidence: {
          include: {
            submittedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      dispute: finalDispute,
      message: `Dispute ${action} successfully`,
    })
  } catch (error) {
    console.error("Error updating dispute:", error)
    return NextResponse.json(
      { message: "Failed to update dispute", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}