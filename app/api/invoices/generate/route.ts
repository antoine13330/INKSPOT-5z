import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { appointmentId, clientId, conversationId, type } = await request.json()

    if (!appointmentId || !clientId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Vérifier que l'utilisateur est bien le professionnel
    if (session.user.role !== "PRO") {
      return NextResponse.json({ error: "Only professionals can generate invoices" }, { status: 403 })
    }

    // Récupérer les détails du rendez-vous
    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
        proId: session.user.id,
        clientId: clientId
      },
      include: {
        client: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        pro: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            businessName: true,
            email: true,
            businessAddress: true,
            siret: true,
            vatNumber: true
          }
        },
        payments: {
          where: {
            status: 'COMPLETED'
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    // Vérifier que le rendez-vous est terminé et payé
    if (appointment.status !== 'COMPLETED') {
      return NextResponse.json({ error: "Can only generate invoices for completed appointments" }, { status: 400 })
    }

    // Calculer le total payé
    const totalPaid = appointment.payments.reduce((sum, p) => sum + p.amount, 0)
    if (totalPaid < appointment.price) {
      return NextResponse.json({ error: "Appointment not fully paid" }, { status: 400 })
    }

    // Générer un numéro de facture unique
    const invoiceNumber = `FACT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Créer la facture dans la base de données
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        appointmentId: appointment.id,
        issuerId: session.user.id,
        receiverId: clientId,
        amount: appointment.price,
        currency: appointment.currency,
        description: `Facture pour la prestation: ${appointment.title}`,
        dueDate: new Date(), // Facture due immédiatement
        status: 'PAID',
        paidAt: new Date(),
        items: [
          {
            description: appointment.title,
            quantity: 1,
            unitPrice: appointment.price,
            total: appointment.price,
            type: 'SERVICE'
          }
        ],
        paymentTerms: 'Paiement effectué',
        notes: `Prestation effectuée le ${format(new Date(appointment.startDate), 'dd/MM/yyyy', { locale: fr })}`
      }
    })

    // Créer une notification pour le client
    await prisma.notification.create({
      data: {
        title: "Facture générée",
        message: `Une facture de ${appointment.price}€ a été générée pour votre prestation "${appointment.title}"`,
        type: "PAYMENT",
        userId: clientId,
        data: {
          invoiceId: invoice.id,
          appointmentId: appointment.id,
          amount: appointment.price,
          type: "invoice_generated"
        }
      }
    })

    // Générer le contenu de la facture (format PDF ou HTML)
    const invoiceContent = generateInvoiceContent(invoice, appointment)

    // Retourner la facture générée
    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        status: invoice.status,
        createdAt: invoice.createdAt
      },
      invoiceContent,
      message: "Facture générée avec succès"
    })

  } catch (error) {
    console.error("Error generating invoice:", error)
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    )
  }
}

function generateInvoiceContent(invoice: any, appointment: any) {
  const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: fr })
  const appointmentDate = format(new Date(appointment.startDate), 'dd/MM/yyyy', { locale: fr })
  
  return {
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facture ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .company-info { margin-bottom: 30px; }
          .client-info { margin-bottom: 30px; }
          .invoice-details { margin-bottom: 30px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f8f9fa; }
          .total { text-align: right; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FACTURE</h1>
          <h2>${invoice.invoiceNumber}</h2>
        </div>
        
        <div class="company-info">
          <h3>Émetteur</h3>
          <p><strong>${appointment.pro.businessName || `${appointment.pro.firstName} ${appointment.pro.lastName}`}</strong></p>
          ${appointment.pro.businessAddress ? `<p>${appointment.pro.businessAddress}</p>` : ''}
          ${appointment.pro.siret ? `<p>SIRET: ${appointment.pro.siret}</p>` : ''}
          ${appointment.pro.vatNumber ? `<p>TVA: ${appointment.pro.vatNumber}</p>` : ''}
        </div>
        
        <div class="client-info">
          <h3>Client</h3>
          <p><strong>${appointment.client.firstName && appointment.client.lastName ? 
            `${appointment.client.firstName} ${appointment.client.lastName}` : 
            appointment.client.username}</strong></p>
          <p>Email: ${appointment.client.email}</p>
        </div>
        
        <div class="invoice-details">
          <p><strong>Date de facturation:</strong> ${currentDate}</p>
          <p><strong>Date de prestation:</strong> ${appointmentDate}</p>
          <p><strong>Statut:</strong> Payé</p>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${appointment.title}</td>
              <td>1</td>
              <td>${appointment.price}€</td>
              <td>${appointment.price}€</td>
            </tr>
          </tbody>
        </table>
        
        <div class="total">
          <p>Total TTC: <strong>${appointment.price}€</strong></p>
        </div>
        
        <div class="footer">
          <p>Facture générée automatiquement par INKSPOT</p>
          <p>Merci de votre confiance !</p>
        </div>
      </body>
      </html>
    `,
    text: `
      FACTURE ${invoice.invoiceNumber}
      
      ÉMETTEUR:
      ${appointment.pro.businessName || `${appointment.pro.firstName} ${appointment.pro.lastName}`}
      ${appointment.pro.businessAddress || ''}
      ${appointment.pro.siret ? `SIRET: ${appointment.pro.siret}` : ''}
      
      CLIENT:
      ${appointment.client.firstName && appointment.client.lastName ? 
        `${appointment.client.firstName} ${appointment.client.lastName}` : 
        appointment.client.username}
      Email: ${appointment.client.email}
      
      DÉTAILS:
      Date de facturation: ${currentDate}
      Date de prestation: ${appointmentDate}
      Statut: Payé
      
      PRESTATION:
      ${appointment.title} - ${appointment.price}€
      
      TOTAL TTC: ${appointment.price}€
      
      Facture générée automatiquement par INKSPOT
    `
  }
}
