"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PaymentDebug() {
  const [appointmentId, setAppointmentId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testPayments = async () => {
    if (!appointmentId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/payments`)
      const data = await response.json()
      setResult(data)
      console.log('Payment debug result:', data)
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setResult({ error: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🐛 Debug des Paiements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="ID de l'appointment"
            value={appointmentId}
            onChange={(e) => setAppointmentId(e.target.value)}
          />
          <Button onClick={testPayments} disabled={loading || !appointmentId}>
            {loading ? 'Chargement...' : 'Tester'}
          </Button>
        </div>

        {result && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Résultat:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
