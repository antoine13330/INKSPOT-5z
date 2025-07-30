import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function createStripeCustomer(userId: string, email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  return customer;
}

export async function createStripeAccount(userId: string, email: string, country: string = 'FR') {
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
  });

  return account;
}

export async function createPaymentIntent(amount: number, currency: string = 'eur', customerId?: string) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    customer: customerId,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}

export async function createCheckoutSession(params: {
  lineItems: Array<{ price: string; quantity: number }>;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  metadata?: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: params.lineItems,
    mode: params.mode,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer: params.customerId,
    metadata: params.metadata,
  });

  return session;
}

export async function createProduct(name: string, description?: string) {
  const product = await stripe.products.create({
    name,
    description,
  });

  return product;
}

export async function createPrice(productId: string, amount: number, currency: string = 'eur', recurring?: { interval: 'day' | 'week' | 'month' | 'year' }) {
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: Math.round(amount * 100),
    currency,
    recurring,
  });

  return price;
}

export async function createTransfer(amount: number, destination: string, currency: string = 'eur') {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency,
    destination,
  });

  return transfer;
}

export async function getAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink;
}
