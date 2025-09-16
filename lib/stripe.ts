import Stripe from 'stripe'

// Configuration Stripe - gère le cas où la clé n'est pas disponible pendant le build
let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    })
  } catch (error) {
    console.warn('Failed to initialize Stripe:', error)
    stripe = null
  }
}

export { stripe }

// Types pour les paiements
export interface PaymentIntentData {
  amount: number
  currency: string
  appointmentId: string
  clientId: string
  proId: string
  description: string
  metadata?: Record<string, string>
}

export interface CreatePaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
}

// Créer une intention de paiement
export async function createPaymentIntent(data: PaymentIntentData): Promise<CreatePaymentIntentResponse> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount * 100, // Stripe utilise les centimes
      currency: data.currency.toLowerCase(),
      metadata: {
        appointmentId: data.appointmentId,
        clientId: data.clientId,
        proId: data.proId,
        ...data.metadata,
      },
      description: data.description,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw new Error('Failed to create payment intent')
  }
}

// Confirmer un paiement
export async function confirmPayment(paymentIntentId: string): Promise<boolean> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent.status === 'succeeded'
  } catch (error) {
    console.error('Error confirming payment:', error)
    return false
  }
}

// Rembourser un paiement
export async function refundPayment(paymentIntentId: string, amount?: number): Promise<boolean> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? amount * 100 : undefined,
    })
    return refund.status === 'succeeded'
  } catch (error) {
    console.error('Error refunding payment:', error)
    return false
  }
}

// Créer un lien de paiement
export async function createPaymentLink(data: {
  amount: number
  currency: string
  appointmentId: string
  description: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: data.currency.toLowerCase(),
            product_data: {
              name: data.description,
            },
            unit_amount: data.amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: {
        appointmentId: data.appointmentId,
      },
    })

    return session.url!
  } catch (error) {
    console.error('Error creating payment link:', error)
    throw new Error('Failed to create payment link')
  }
}

// Créer une session de checkout Stripe
export async function createCheckoutSession(data: {
  paymentIntentId: string
  amount: number
  currency: string
  description: string
  successUrl: string
  cancelUrl: string
}): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: data.currency.toLowerCase(),
            product_data: {
              name: data.description,
            },
            unit_amount: data.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: {
        paymentIntentId: data.paymentIntentId,
      },
    })

    return session.url!
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw new Error('Failed to create checkout session')
  }
}

// Créer un client Stripe
export async function createStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
      },
    })
    return customer
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw new Error('Failed to create Stripe customer')
  }
}

// Créer un compte Stripe Connect
export async function createStripeAccount(
  userId: string,
  email: string,
  country: string = 'FR'
): Promise<Stripe.Account> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        userId,
      },
    })
    return account
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    throw new Error('Failed to create Stripe Connect account')
  }
}

// Créer un lien de compte pour l'onboarding Stripe Connect
export async function getAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })
    return accountLink
  } catch (error) {
    console.error('Error creating account link:', error)
    throw new Error('Failed to create account link')
  }
}

// Créer un virement (payout) vers un compte Stripe Connect
export async function createPayout(
  amount: number,
  stripeAccountId: string
): Promise<Stripe.Transfer> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const transfer = await stripe.transfers.create({
      amount: amount * 100, // Stripe utilise les centimes
      currency: 'eur',
      destination: stripeAccountId,
      description: 'Payout from INKSPOT platform',
    })
    return transfer
  } catch (error) {
    console.error('Error creating payout:', error)
    throw new Error('Failed to create payout')
  }
}

// Créer un transfert entre comptes
export async function createTransfer(
  amount: number,
  destinationAccountId: string,
  sourceTransactionId?: string
): Promise<Stripe.Transfer> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }
  
  try {
    const transfer = await stripe.transfers.create({
      amount: amount * 100, // Stripe utilise les centimes
      currency: 'eur',
      destination: destinationAccountId,
      source_transaction: sourceTransactionId,
      description: 'Transfer from INKSPOT platform',
    })
    return transfer
  } catch (error) {
    console.error('Error creating transfer:', error)
    throw new Error('Failed to create transfer')
  }
}
