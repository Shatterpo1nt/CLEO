import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClientDirect } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { mode, label, nombre, instructions, creneaux, lieu_alternatif } = await request.json()
    if (!mode) return NextResponse.json({ error: 'Mode de remise requis.' }, { status: 400 })

    const admin = createAdminClientDirect()

    // Trouver un slot libre (user_id IS NULL) ou utiliser l'existant
    const { data: existingSlot } = await supabase
      .from('key_slots')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let slotId: string

    if (existingSlot) {
      slotId = existingSlot.id
    } else {
      // Assigner le premier slot libre
      const { data: freeSlots } = await admin
        .from('key_slots')
        .select('id, slot_number')
        .is('user_id', null)
        .order('slot_number', { ascending: true })
        .limit(1)

      if (!freeSlots || freeSlots.length === 0) {
        return NextResponse.json({ error: 'Aucun emplacement disponible. Contactez-nous.' }, { status: 503 })
      }
      slotId = freeSlots[0].id
    }

    // Mettre à jour le slot
    const { error: updateError } = await admin
      .from('key_slots')
      .update({
        user_id: user.id,
        label: label || null,
        nombre: parseInt(nombre) || 1,
        instructions: instructions || null,
        mode_depot: mode,
        lieu_remise_alternatif: lieu_alternatif || null,
        status: 'depot_a_organiser',
        assigned_at: new Date().toISOString(),
        notes: creneaux ? `Créneaux : ${creneaux}` : null,
      })
      .eq('id', slotId)

    if (updateError) {
      console.error('Depot update error:', updateError)
      return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Depot error:', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
