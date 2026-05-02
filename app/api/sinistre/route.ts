import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClientDirect } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { urgence, adresse_remise, telephone_joignable, personne_remise, creneau_souhaite, contexte } = await request.json()
    if (!urgence || !adresse_remise || !telephone_joignable) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 })
    }

    const admin = createAdminClientDirect()

    // Récupérer le slot de l'utilisateur
    const { data: slot } = await supabase
      .from('key_slots')
      .select('id, recovery_count_used')
      .eq('user_id', user.id)
      .single()

    if (!slot) {
      return NextResponse.json({ error: 'Aucune clé enregistrée.' }, { status: 400 })
    }

    // Vérifier le quota (via subscriptions)
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('recovery_count_used')
      .eq('user_id', user.id)
      .single()

    if (sub && (sub.recovery_count_used ?? 0) >= 2) {
      return NextResponse.json({
        error: 'Vous avez atteint votre quota annuel (2 récupérations). Contactez-nous pour toute demande complémentaire.',
      }, { status: 400 })
    }

    // Créer l'entrée sinistre
    const { error: insertError } = await admin
      .from('sinistres')
      .insert({
        user_id: user.id,
        key_slot_id: slot.id,
        urgence,
        adresse_remise,
        telephone_joignable,
        personne_remise: personne_remise || null,
        creneau_souhaite: urgence === 'critique' ? 'dès que possible' : (creneau_souhaite || null),
        contexte: contexte || null,
        status: 'declare',
      })

    if (insertError) {
      console.error('Sinistre insert error:', insertError)
      return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
    }

    // Mettre à jour le statut de la clé
    await admin
      .from('key_slots')
      .update({ status: 'sinistre_declare' })
      .eq('id', slot.id)

    // Incrémenter le compteur
    await admin
      .from('subscriptions')
      .update({ recovery_count_used: (sub?.recovery_count_used ?? 0) + 1 })
      .eq('user_id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Sinistre error:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
