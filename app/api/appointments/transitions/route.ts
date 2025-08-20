import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

// Status transition configuration
const STATUS_TRANSITIONS = {
  PROPOSED: {
    label: "Proposé",
    description: "Rendez-vous proposé en attente de réponse",
    transitions: [
      {
        to: "ACCEPTED",
        label: "Accepter",
        description: "Accepter la proposition",
        requiredRole: ["client"],
        color: "green",
        icon: "check"
      },
      {
        to: "CANCELLED",
        label: "Refuser",
        description: "Refuser la proposition",
        requiredRole: ["client", "pro"],
        color: "red",
        icon: "x"
      }
    ]
  },
  ACCEPTED: {
    label: "Accepté",
    description: "Proposition acceptée, en attente de confirmation",
    transitions: [
      {
        to: "CONFIRMED",
        label: "Confirmer",
        description: "Confirmer le rendez-vous",
        requiredRole: ["pro"],
        color: "blue",
        icon: "check-circle",
        conditions: ["deposit_paid_if_required"]
      },
      {
        to: "CANCELLED",
        label: "Annuler",
        description: "Annuler le rendez-vous",
        requiredRole: ["client", "pro"],
        color: "red",
        icon: "x"
      }
    ]
  },
  CONFIRMED: {
    label: "Confirmé",
    description: "Rendez-vous confirmé et programmé",
    transitions: [
      {
        to: "COMPLETED",
        label: "Terminer",
        description: "Marquer comme terminé",
        requiredRole: ["pro"],
        color: "green",
        icon: "check-circle",
        conditions: ["full_payment_received"]
      },
      {
        to: "CANCELLED",
        label: "Annuler",
        description: "Annuler le rendez-vous",
        requiredRole: ["client", "pro"],
        color: "red",
        icon: "x"
      },
      {
        to: "RESCHEDULED",
        label: "Reporter",
        description: "Demander un report",
        requiredRole: ["client", "pro"],
        color: "orange",
        icon: "calendar"
      }
    ]
  },
  COMPLETED: {
    label: "Terminé",
    description: "Rendez-vous réalisé avec succès",
    transitions: [
      {
        to: "CANCELLED",
        label: "Annuler (Admin)",
        description: "Annulation administrative",
        requiredRole: ["admin"],
        color: "red",
        icon: "x"
      }
    ]
  },
  CANCELLED: {
    label: "Annulé",
    description: "Rendez-vous annulé",
    transitions: []
  },
  RESCHEDULED: {
    label: "À reporter",
    description: "Demande de report en cours",
    transitions: [
      {
        to: "PROPOSED",
        label: "Nouvelle proposition",
        description: "Proposer une nouvelle date",
        requiredRole: ["pro"],
        color: "blue",
        icon: "calendar"
      },
      {
        to: "CANCELLED",
        label: "Annuler",
        description: "Annuler définitivement",
        requiredRole: ["client", "pro"],
        color: "red",
        icon: "x"
      }
    ]
  }
}

// Conditions that must be met for certain transitions
const TRANSITION_CONDITIONS = {
  deposit_paid_if_required: {
    label: "Acompte payé (si requis)",
    description: "L'acompte doit être payé si requis pour ce rendez-vous"
  },
  full_payment_received: {
    label: "Paiement intégral reçu",
    description: "Le paiement complet doit être reçu"
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const currentStatus = searchParams.get('status')
    const userRole = searchParams.get('role') || (session.user.role === 'PRO' ? 'pro' : 'client')

    // If a specific status is requested, return transitions for that status
    if (currentStatus && STATUS_TRANSITIONS[currentStatus as keyof typeof STATUS_TRANSITIONS]) {
      const statusConfig = STATUS_TRANSITIONS[currentStatus as keyof typeof STATUS_TRANSITIONS]
      
      // Filter transitions based on user role
      const availableTransitions = statusConfig.transitions.filter(transition => 
        transition.requiredRole.includes(userRole) || 
        (userRole === 'admin') || 
        transition.requiredRole.includes('admin')
      )

      return NextResponse.json({
        success: true,
        currentStatus: {
          status: currentStatus,
          ...statusConfig
        },
        availableTransitions,
        conditions: TRANSITION_CONDITIONS,
        userRole
      })
    }

    // Return all status configurations
    return NextResponse.json({
      success: true,
      statusTransitions: STATUS_TRANSITIONS,
      conditions: TRANSITION_CONDITIONS,
      userRole,
      availableStatuses: Object.keys(STATUS_TRANSITIONS)
    })

  } catch (error) {
    console.error("Error fetching appointment transitions:", error)
    return NextResponse.json({ 
      error: "Failed to fetch appointment transitions" 
    }, { status: 500 })
  }
}

