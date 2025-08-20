import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est bien le professionnel
    if (session.user.role !== "PRO") {
      return NextResponse.json({ error: "Only professionals can export invoices" }, { status: 403 })
    }

    // Récupérer toutes les factures du professionnel
    const invoices = await prisma.invoice.findMany({
      where: {
        issuerId: session.user.id,
        status: 'PAID'
      },
      include: {
        appointment: {
          include: {
            client: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (invoices.length === 0) {
      return NextResponse.json({ error: "No invoices found" }, { status: 404 })
    }

    // Générer le contenu CSV
    const csvContent = generateCSVContent(invoices)

    // Retourner le fichier CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="factures-${format(new Date(), 'yyyy-MM-dd')}.csv"`
      }
    })

  } catch (error) {
    console.error("Error exporting invoices:", error)
    return NextResponse.json(
      { error: "Failed to export invoices" },
      { status: 500 }
    )
  }
}

function generateCSVContent(invoices: any[]) {
  const headers = [
    'Numéro de facture',
    'Date de facturation',
    'Client',
    'Email client',
    'Prestation',
    'Montant (€)',
    'Statut',
    'Date de paiement'
  ]

  const rows = invoices.map(invoice => [
    invoice.invoiceNumber,
    format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: fr }),
    invoice.appointment?.client?.firstName && invoice.appointment?.client?.lastName
      ? `${invoice.appointment.client.firstName} ${invoice.appointment.client.lastName}`
      : invoice.appointment?.client?.username || 'N/A',
    invoice.appointment?.client?.email || 'N/A',
    invoice.appointment?.title || 'N/A',
    invoice.amount,
    invoice.status === 'PAID' ? 'Payée' : 'En attente',
    invoice.paidAt ? format(new Date(invoice.paidAt), 'dd/MM/yyyy', { locale: fr }) : 'N/A'
  ])

  // Convertir en CSV avec gestion des caractères spéciaux
  const csvRows = [headers, ...rows]
  const csvContent = csvRows
    .map(row => 
      row.map(cell => 
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
          ? `"${cell.replace(/"/g, '""')}"`
          : cell
      ).join(',')
    )
    .join('\n')

  // Ajouter le BOM pour l'encodage UTF-8
  return '\ufeff' + csvContent
}
