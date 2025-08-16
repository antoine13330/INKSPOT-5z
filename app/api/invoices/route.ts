import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateInvoice, sendInvoiceEmail, markInvoiceAsPaid, getInvoicesByUser } from "@/lib/invoice-generator"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { 
      amount, 
      currency = "EUR", 
      vatAmount,
      description, 
      dueDate, 
      receiverId, 
      bookingId,
      sendEmail = true 
    } = await request.json()

    if (!amount || !description || !dueDate || !receiverId) {
      return NextResponse.json({ 
        message: "Amount, description, due date, and receiver are required" 
      }, { status: 400 })
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    })

    if (!receiver) {
      return NextResponse.json({ message: "Receiver not found" }, { status: 404 })
    }

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Create invoice
    const invoiceId = await generateInvoice({
      invoiceNumber,
      amount,
      currency: currency.toUpperCase(),
      vatAmount,
      description,
      dueDate: new Date(dueDate),
      issuerId: session.user.id,
      receiverId,
      bookingId,
    })

    // Send invoice email if requested
    if (sendEmail) {
      try {
        await sendInvoiceEmail(invoiceId)
      } catch (error) {
        console.error("Failed to send invoice email:", error)
        // Don't fail the request if email fails
      }
    }

    // Get the created invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        issuer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        booking: true,
      },
    })

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create invoice", error: error instanceof Error ? error.message : "Unknown error" },
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
    const type = url.searchParams.get("type") as "issued" | "received" || "received"
    const userId = url.searchParams.get("userId") || session.user.id

    // Check if user can access this data
    const isAdmin = session.user.role === "ADMIN"
    const isOwner = session.user.id === userId

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Not authorized to view this data" }, { status: 403 })
    }

    const invoices = await getInvoicesByUser(userId, type)

    return NextResponse.json({
      success: true,
      invoices,
    })
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch invoices" },
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

    const { invoiceId, action, paymentId } = await request.json()

    if (!invoiceId || !action) {
      return NextResponse.json({ message: "Invoice ID and action are required" }, { status: 400 })
    }

    // Verify invoice exists and user has permission
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        issuer: true,
        receiver: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 })
    }

    const isIssuer = invoice.issuerId === session.user.id
    const isReceiver = invoice.receiverId === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isIssuer && !isReceiver && !isAdmin) {
      return NextResponse.json({ message: "Not authorized to modify this invoice" }, { status: 403 })
    }

    switch (action) {
      case "mark_paid":
        if (!isIssuer && !isAdmin) {
          return NextResponse.json({ message: "Only the issuer can mark invoice as paid" }, { status: 403 })
        }
        
        await markInvoiceAsPaid(invoiceId, paymentId)
        break

      case "resend_email":
        if (!isIssuer && !isAdmin) {
          return NextResponse.json({ message: "Only the issuer can resend invoice" }, { status: 403 })
        }
        
        await sendInvoiceEmail(invoiceId)
        break

      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    // Get updated invoice
    const updatedInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        issuer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        booking: true,
        payment: true,
      },
    })

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: `Invoice ${action.replace('_', ' ')} successfully`,
    })
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update invoice", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}