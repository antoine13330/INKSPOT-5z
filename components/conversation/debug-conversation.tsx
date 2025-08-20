"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function DebugConversation() {
  const [participantId, setParticipantId] = useState("")
  const [postId, setPostId] = useState("")
  const [subject, setSubject] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testCreateConversation = async () => {
    setLoading(true)
    setResult(null)

    try {
      console.log("🚀 Test création conversation avec:", {
        participantId,
        postId,
        subject,
        type: "DIRECT"
      })

      const response = await fetch('/api/conversations/create-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId,
          postId,
          subject,
          type: 'DIRECT'
        })
      })

      console.log("📡 Réponse reçue:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      const data = await response.json()
      console.log("📦 Données reçues:", data)

      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      })

      if (response.ok) {
        // Conversation created successfully
      } else {
        toast.error(`❌ Erreur ${response.status}: ${data.error || 'Erreur inconnue'}`)
      }

    } catch (error) {
      console.error("💥 Erreur réseau:", error)
      setResult({
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      })
      toast.error("💥 Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🐛 Debug - Création de Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="participantId">ID Participant</Label>
              <Input
                id="participantId"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="ex: user123"
              />
            </div>
            <div>
              <Label htmlFor="postId">ID Post</Label>
              <Input
                id="postId"
                value={postId}
                onChange={(e) => setPostId(e.target.value)}
                placeholder="ex: post456"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="subject">Sujet</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ex: Demande de devis"
            />
          </div>

          <Button 
            onClick={testCreateConversation}
            disabled={loading || !participantId || !postId || !subject}
            className="w-full"
          >
            {loading ? "🔄 Test en cours..." : "🧪 Tester la création"}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">📊 Résultat du test:</h3>
              <pre className="text-sm overflow-auto bg-background p-2 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Instructions de test:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Utilisez des IDs valides de votre base de données</li>
              <li>• Vérifiez la console du navigateur pour les logs détaillés</li>
              <li>• Si erreur 401: problème d'authentification</li>
              <li>• Si erreur 400: problème de validation des données</li>
              <li>• Si erreur 500: problème côté serveur</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
