"use client"
import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

// Charger Stripe (remplacez par votre clé publique)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentProps {
  clientSecret: string
  amount: number
  currency: string
  onSuccess: (paymentIntent: any) => void
  onError: (error: string) => void
  onCancel: () => void
}

export function StripePayment({ clientSecret, amount, currency, onSuccess, onError, onCancel }: StripePaymentProps) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Elements>
  )
}

interface PaymentFormProps {
  amount: number
  currency: string
  onSuccess: (paymentIntent: any) => void
  onError: (error: string) => void
  onCancel: () => void
}

function PaymentForm({ amount, currency, onSuccess, onError, onCancel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: submitError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (submitError) {
        setError(submitError.message || 'Une erreur est survenue lors du paiement')
        onError(submitError.message || 'Erreur de paiement')
      } else {
        setSuccess(true)
        toast.success('Paiement effectué avec succès !')
        onSuccess({ status: 'succeeded' })
      }
    } catch (err) {
      const errorMessage = 'Une erreur inattendue est survenue'
      setError(errorMessage)
      onError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Paiement réussi !</h3>
          <p className="text-muted-foreground">
            Votre paiement de {amount} {currency} a été traité avec succès.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Paiement sécurisé
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Montant à payer</label>
            <div className="text-2xl font-bold text-primary">
              {amount} {currency}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Informations de carte</label>
            <div className="border rounded-lg p-3">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!stripe || loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payer {amount} {currency}
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>Vos informations de paiement sont sécurisées par Stripe</p>
            <p>Nous ne stockons jamais vos données de carte</p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Composant de paiement simplifié pour les liens de paiement
export function StripeCheckoutButton({ 
  checkoutUrl, 
  amount, 
  currency, 
  onSuccess 
}: { 
  checkoutUrl: string
  amount: number
  currency: string
  onSuccess: () => void
}) {
  const handleCheckout = () => {
    window.open(checkoutUrl, '_blank')
    onSuccess()
  }

  return (
    <Button onClick={handleCheckout} className="w-full">
      <CreditCard className="w-4 h-4 mr-2" />
      Payer {amount} {currency} via Stripe
    </Button>
  )
}
