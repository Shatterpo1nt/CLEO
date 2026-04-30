import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// IDs des prix Stripe — à remplir après création dans le dashboard
export const STRIPE_PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,  // ex: price_xxx
  annual:  process.env.STRIPE_PRICE_ANNUAL!,   // ex: price_yyy
}
