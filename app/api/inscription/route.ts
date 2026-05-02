import { NextRequest, NextResponse } from 'next/server'
import { createAdminClientDirect } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const {
      prenom, nom, email, telephone,
      adresse, ville, code_postal, type_logement,
      plan,
    } = await request.json()

    if (!email || !prenom || !nom || !plan) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    const supabase = createAdminClientDirect()

    // 1. Créer le compte Supabase (ou récupérer l'existant)
    //    generateLink crée l'utilisateur s'il n'existe pas ET envoie le lien de connexion
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
      },
    })

    if (linkError || !linkData?.user) {
      console.error('generateLink error:', linkError)
      return NextResponse.json({ error: 'Erreur création du compte. Veuillez réessayer.' }, { status: 500 })
    }

    const userId = linkData.user.id

    // 2. Sauvegarder le profil étendu
    await supabase.from('user_profiles').upsert({
      user_id: userId,
      prenom,
      nom,
      telephone,
      adresse,
      ville,
      code_postal,
      type_logement,
      cgv_accepted_at: new Date().toISOString(),
      cgu_accepted_at: new Date().toISOString(),
      privacy_accepted_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    // 3. Créer client Stripe + session checkout
    const priceId = STRIPE_PRICES[plan as 'monthly' | 'annual']
    if (!priceId) {
      return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 })
    }

    // Récupérer ou créer le customer Stripe
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = existingSub?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: `${prenom} ${nom}`,
        phone: telephone,
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/confirmation`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/inscription?plan=${plan}&reprise=true`,
      metadata: {
        supabase_user_id: userId,
        plan,
      },
    })

    // 4. Sauvegarder la tentative de souscription
    await supabase.from('souscriptions_en_attente').upsert({
      email,
      prenom,
      nom,
      telephone,
      adresse,
      ville,
      code_postal,
      type_logement,
      plan,
      stripe_session_id: session.id,
    }, { onConflict: 'email' })

    return NextResponse.json({ url: session.url })

  } catch (err) {
    console.error('Inscription error:', err)
    return NextResponse.json({ error: 'Erreur serveur. Veuillez réessayer.' }, { status: 500 })
  }
}
