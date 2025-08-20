"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useProposalNotifications } from '@/hooks/useProposalNotifications'
import { ProposalNotification } from '@/components/ui/proposal-notification'

interface ProposalNotificationTestProps {
  conversationId?: string
}

export function ProposalNotificationTest({ conversationId = "test-conversation" }: ProposalNotificationTestProps) {
  const [showTestNotification, setShowTestNotification] = useState(false)
  
  const {
    recentProposals,
    isConnected,
    clearProposal,
    clearAllProposals,
    totalProposals
  } = useProposalNotifications({
    conversationId,
    onProposalReceived: (proposal) => {
      console.log('Test: Proposition reçue:', proposal)
    },
    onProposalStatusChanged: (data) => {
      console.log('Test: Statut changé:', data)
    },
    showToastNotifications: true
  })

  const simulateProposal = () => {
    // Simuler une proposition de test
    const testProposal = {
      appointmentId: `test-${Date.now()}`,
      conversationId,
      proposalData: {
        title: "Test de proposition",
        type: "TATTOO",
        price: 150,
        currency: "EUR",
        duration: 120,
        location: "Studio de test",
        description: "Ceci est une proposition de test pour vérifier les notifications en temps réel.",
        proId: "test-pro",
        clientId: "test-client",
        createdAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }

    // Simuler l'événement WebSocket
    const event = new CustomEvent('proposal-created', { detail: testProposal })
    window.dispatchEvent(event)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Test Notifications
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Connecté" : "Déconnecté"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button onClick={simulateProposal} className="w-full">
            Simuler une proposition
          </Button>
          
          <Button 
            onClick={() => setShowTestNotification(!showTestNotification)} 
            variant="outline" 
            className="w-full"
          >
            {showTestNotification ? "Masquer" : "Afficher"} notification de test
          </Button>
          
          <Button 
            onClick={clearAllProposals} 
            variant="destructive" 
            className="w-full"
          >
            Effacer toutes ({totalProposals})
          </Button>
        </div>

        {/* Affichage des propositions récentes */}
        {recentProposals.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Propositions récentes:</h4>
            {recentProposals.map((proposal, index) => (
              <div key={proposal.appointmentId} className="text-sm p-2 bg-gray-50 rounded">
                <div className="font-medium">{proposal.proposalData.title}</div>
                <div className="text-gray-600">
                  {proposal.proposalData.price}€ • {proposal.proposalData.duration} min
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => clearProposal(proposal.appointmentId)}
                  className="mt-1"
                >
                  Effacer
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Notification de test statique */}
        {showTestNotification && (
          <ProposalNotification
            proposal={{
              appointmentId: "test-static",
              conversationId: "test",
              proposalData: {
                title: "Proposition de test statique",
                type: "TATTOO",
                price: 200,
                currency: "EUR",
                duration: 180,
                location: "Studio de test",
                description: "Cette notification est affichée statiquement pour tester le composant.",
                proId: "test-pro",
                clientId: "test-client",
                createdAt: new Date().toISOString()
              },
              timestamp: new Date().toISOString()
            }}
            onAccept={() => alert("Proposition acceptée!")}
            onReject={() => alert("Proposition refusée!")}
            onView={() => alert("Voir détails!")}
            onDismiss={() => setShowTestNotification(false)}
          />
        )}
      </CardContent>
    </Card>
  )
}
