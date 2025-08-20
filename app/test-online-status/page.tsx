"use client"

import { OnlineStatusDebug } from "@/components/debug/online-status-debug"

export default function TestOnlineStatusPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Test du Système de Statut En Ligne
        </h1>
        
        <div className="space-y-6">
          <OnlineStatusDebug />
          
          <div className="bg-muted p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Instructions de test :</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Connectez-vous avec un compte utilisateur</li>
              <li>Ouvrez cette page dans un autre onglet avec un autre compte</li>
              <li>Vérifiez que les deux utilisateurs se voient en ligne</li>
              <li>Testez les boutons "Marquer En ligne/Hors ligne"</li>
              <li>Fermez un onglet et vérifiez que l'autre voit le changement</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
