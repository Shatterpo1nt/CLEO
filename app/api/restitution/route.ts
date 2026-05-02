import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClientDirect } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { mode, creneau_souhaite, adresse_remise } = await request.json()
    if (!mode) return NextResponse.json({ error: 'Mode de restitution requis.' }, { status: 400 })

    const admin = createAdminClientDirect()

    // Récupérer le slot
    const { data: slot } = await supabase
      .from('key_slots')
      .select('id, status')
      .eq('user_id', user.id)
      .single()

    if (!slot) {
      return NextResponse.json({ error: 'Aucune clé enregistrée.' }, { status: 400 })
    }

    // Bloquer si sinistre en cours
    if (slot.status === 'intervention_en_cours') {
      return NextResponse.json({
        error: "Une intervention est en cours. Veuillez attendre sa clôture avant de demander une restitution définitive.",
      }, { status: 400 })
    }

    // Créer la restitution
    const { error: insertError } = await admin
      .from('restitutions_definitives')
      .insert({
        user_id: user.id,
        key_slot_id: slot.id,
        mode_restitution: mode,
        creneau_souhaite: creneau_souhaite || null,
        adresse_remise: adresse_remise || null,
        status: 'demandee',
      })

    if (insertError) {
      console.error('Restitution insert error:', insertError)
      return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
    }

    // Mettre à jour le statut de la clé
    await admin
      .from('key_slots')
      .update({ status: 'restitution_def_demandee' })
      .eq('id', slot.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Restitution error:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
