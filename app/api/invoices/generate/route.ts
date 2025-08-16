import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, invoiceData } = body

    if (!appointmentId || !invoiceData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Vérifier que l'utilisateur est le professionnel du rendez-vous
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { pro: true, client: true }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    if (appointment.proId !== session.user.id) {
      return NextResponse.json({ error: "Only the professional can generate invoices" }, { status: 403 })
    }

    // Générer un numéro de facture unique s'il n'est pas fourni
    let invoiceNumber = invoiceData.invoiceNumber
    if (!invoiceNumber) {
      const lastInvoice = await prisma.invoice.findFirst({
        where: { issuerId: session.user.id },
        orderBy: { createdAt: 'desc' }
      })

      const year = new Date().getFullYear()
      const sequence = lastInvoice ? 
        parseInt(lastInvoice.invoiceNumber.split('-')[2]) + 1 : 1
      invoiceNumber = `FAC-${year}-${sequence.toString().padStart(3, '0')}`
    }

    // Créer la facture
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        appointmentId,
        issuerId: session.user.id,
        receiverId: appointment.clientId,
        amount: invoiceData.amount,
        currency: appointment.currency,
        vatAmount: invoiceData.vatAmount,
        vatRate: invoiceData.vatAmount > 0 ? (invoiceData.vatAmount / (invoiceData.amount - invoiceData.vatAmount)) * 100 : 0,
        description: invoiceData.description || appointment.title,
        dueDate: new Date(invoiceData.dueDate),
        status: 'DRAFT',
        paymentTerms: invoiceData.paymentTerms,
        notes: invoiceData.notes,
        items: invoiceData.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          vatRate: item.vatRate,
          vatAmount: item.vatAmount
        }))
      },
      include: {
        issuer: true,
        receiver: true
      }
    })

    // Créer une notification pour le client
    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Nouvelle facture disponible',
        message: `Une facture de ${invoice.amount} ${invoice.currency} a été générée pour votre rendez-vous "${appointment.title}".`,
        userId: appointment.clientId,
        data: { 
          invoiceId: invoice.id, 
          appointmentId: appointment.id,
          amount: invoice.amount,
          currency: invoice.currency
        }
      }
    })

    // Transformer les données pour le frontend
    const transformedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      appointmentId: invoice.appointmentId,
      issuerId: invoice.issuerId,
      receiverId: invoice.receiverId,
      amount: invoice.amount,
      currency: invoice.currency,
      vatAmount: invoice.vatAmount,
      vatRate: invoice.vatRate,
      description: invoice.description,
      dueDate: invoice.dueDate.toISOString(),
      paidAt: invoice.paidAt?.toISOString(),
      status: invoice.status,
      items: invoice.items,
      paymentTerms: invoice.paymentTerms,
      notes: invoice.notes,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      issuer: invoice.issuer,
      receiver: invoice.receiver
    }

    return NextResponse.json({
      success: true,
      message: "Invoice generated successfully",
      invoice: transformedInvoice
    })

  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
