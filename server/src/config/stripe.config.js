// Stripe Configuration for Payment Gateway Integration (TS367)
module.exports = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'usd',
  successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/payment-success',
  cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/payment-cancel',
}; 