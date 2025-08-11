import Stripe from 'stripe';

// Create Stripe client only if the secret key is available
const createStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn('STRIPE_SECRET_KEY not found - Stripe functionality will be disabled');
    return null;
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2025-07-30.basil',
  });
};

export const stripe = createStripeClient();

export async function createStripeCustomer(userId: string, email: string, name?: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  return customer;
}

export async function createStripeAccount(userId: string, email: string, country = 'FR') {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
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

export async function createPaymentIntent(amount: number, currency = 'eur', customerId?: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
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
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
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
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const product = await stripe.products.create({
    name,
    description,
  });

  return product;
}

export async function createPrice(productId: string, amount: number, currency = 'eur', recurring?: { interval: 'day' | 'week' | 'month' | 'year' }) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: Math.round(amount * 100),
    currency,
    recurring,
  });

  return price;
}

export async function createTransfer(amount: number, destination: string, currency = 'eur') {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency,
    destination,
  });

  return transfer;
}

export async function getAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  return accountLink;
}

export async function createPayout(amount: number, currency: string = 'eur', destination: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const payout = await stripe.payouts.create({
    amount: Math.round(amount * 100),
    currency,
    destination,
  });

  return payout;
}

export async function refundPayment(paymentIntentId: string, amount?: number) {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }
  
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  });

  return refund;
}
