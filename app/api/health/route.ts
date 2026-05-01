import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    stripe_secret: !!process.env.STRIPE_SECRET_KEY,
    stripe_pub: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripe_monthly: !!process.env.STRIPE_PRICE_MONTHLY,
    stripe_annual: !!process.env.STRIPE_PRICE_ANNUAL,
    stripe_webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    site_url: !!process.env.NEXT_PUBLIC_SITE_URL,
    // Partial key hint (last 6 chars) to confirm which key is active
    stripe_key_hint: process.env.STRIPE_SECRET_KEY?.slice(-6) ?? 'missing',
    service_key_hint: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-6) ?? 'missing',
    webhook_url: '/api/webhooks/stripe',
  })
}
