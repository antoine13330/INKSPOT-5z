import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")

    if (!clientId) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Vérifier que l'utilisateur est bien le professionnel
    if (session.user.role !== "PRO") {
      return NextResponse.json({ error: "Only professionals can view appointment history" }, { status: 403 })
    }

    // Récupérer tous les rendez-vous avec ce client
    const appointments = await prisma.appointment.findMany({
      where: {
        proId: session.user.id,
        clientId: clientId,
        // Exclure les rendez-vous en brouillon
        status: {
          not: "DRAFT"
        }
      },
      include: {
        client: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            description: true,
            createdAt: true,
            senderId: true,
            receiverId: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    })

    console.log(`Found ${appointments.length} appointments for client ${clientId}`)

    // Enrichir les données avec les informations de paiement
    const enrichedAppointments = appointments.map((appointment: any) => {
      console.log(`Processing appointment ${appointment.id}:`, {
        title: appointment.title,
        price: appointment.price,
        paymentsCount: appointment.payments.length,
        payments: appointment.payments
      })

      // Calculer le total payé (seulement les paiements COMPLETED)
      const totalPaid = appointment.payments
        .filter((p: any) => p.status === 'COMPLETED')
        .reduce((sum: number, p: any) => sum + p.amount, 0)

      console.log(`Total paid for appointment ${appointment.id}: ${totalPaid}€`)

      // Déterminer le type de paiement
      const depositPayment = appointment.payments.find((p: any) => 
        p.description.toLowerCase().includes('acompte') && p.status === 'COMPLETED'
      )
      
      const fullPayment = totalPaid >= appointment.price
      const depositPaid = !!depositPayment

      // Enrichir les paiements avec plus d'informations
      const enrichedPayments = appointment.payments.map((payment: any) => {
        let type = 'FULL_PAYMENT'
        
        if (payment.description.toLowerCase().includes('acompte')) {
          type = 'DEPOSIT'
        } else if (payment.description.toLowerCase().includes('solde') || 
                   payment.description.toLowerCase().includes('balance')) {
          type = 'BALANCE'
        } else if (payment.description.toLowerCase().includes('paiement complet')) {
          type = 'FULL_PAYMENT'
        }

        return {
          ...payment,
          type,
          // Ajouter des informations de débogage
          debug: {
            description: payment.description,
            status: payment.status,
            amount: payment.amount
          }
        }
      })

      return {
        ...appointment,
        depositPaid,
        fullPayment,
        totalPaid, // Ajouter le total payé pour le débogage
        payments: enrichedPayments
      }
    })

    console.log('Enriched appointments:', enrichedAppointments.map((a: any) => ({
      id: a.id,
      title: a.title,
      price: a.price,
      totalPaid: a.totalPaid,
      paymentsCount: a.payments.length
    })))

    return NextResponse.json({
      success: true,
      appointments: enrichedAppointments,
      total: enrichedAppointments.length
    })

  } catch (error) {
    console.error("Error fetching appointment history:", error)
    return NextResponse.json(
      { error: "Failed to fetch appointment history" },
      { status: 500 }
    )
  }
}
