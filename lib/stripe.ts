import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function createStripeCustomer(email: string, name?: string) {
  return await stripe.customers.create({
    email,
    name,
  })
}

export async function createStripeAccount(email: string, country = "FR") {
  return await stripe.accounts.create({
    type: "express",
    email,
    country,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
}

export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  })
}

export async function createPaymentIntent(
  amount: number,
  currency = "eur",
  customerId?: string,
  applicationFeeAmount?: number,
  transferData?: { destination: string },
) {
  const params: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
  }

  if (customerId) {
    params.customer = customerId
  }

  if (applicationFeeAmount) {
    params.application_fee_amount = Math.round(applicationFeeAmount * 100)
  }

  if (transferData) {
    params.transfer_data = transferData
  }

  return await stripe.paymentIntents.create(params)
}

export async function createTransfer(amount: number, destination: string, currency = "eur") {
  return await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency,
    destination,
  })
}

export async function createPayout(amount: number, stripeAccountId: string, currency = "eur") {
  return await stripe.payouts.create(
    {
      amount: Math.round(amount * 100),
      currency,
    },
    {
      stripeAccount: stripeAccountId,
    },
  )
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
  const params: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  }

  if (amount) {
    params.amount = Math.round(amount * 100)
  }

  return await stripe.refunds.create(params)
}
