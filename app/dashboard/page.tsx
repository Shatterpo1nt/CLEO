import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const KEY_STATUS_LABELS: Record<string, string> = {
  aucune_deposee:              'Aucune clé déposée',
  depot_a_organiser:           'Dépôt à organiser',
  depot_planifie:              'Dépôt planifié',
  cle_recue:                   'Clé reçue',
  cle_stockee:                 'Clé stockée',
  sinistre_declare:            'Sinistre déclaré',
  intervention_en_cours:       'Intervention en cours',
  cle_remise_temporairement:   'Clé remise temporairement',
  cle_retournee:               'Clé retournée au stockage',
  restitution_def_demandee:    'Restitution définitive demandée',
  restitution_def_planifiee:   'Restitution définitive planifiée',
  cle_restituee:               'Clé restituée définitivement',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { success?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [subRes, keyRes, profileRes] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase.from('key_slots').select('*').eq('user_id', user.id).order('assigned_at', { ascending: true }),
    supabase.from('user_profiles').select('prenom, nom').eq('user_id', user.id).single(),
  ])

  const subscription = subRes.data
  const keySlots = keyRes.data ?? []
  const profile = profileRes.data

  const isActive = subscription?.status === 'active'
  const isPendingActivation = !!searchParams.success && !isActive

  const primarySlot = keySlots[0] ?? null
  const keyStatus = primarySlot?.status ?? 'aucune_deposee'

  const isKeyStored = ['cle_stockee', 'sinistre_declare', 'intervention_en_cours',
    'cle_remise_temporairement', 'cle_retournee'].includes(keyStatus)
  const isRestitutionInProgress = ['restitution_def_demandee', 'restitution_def_planifiee'].includes(keyStatus)
  const isSinistreActive = ['sinistre_declare', 'intervention_en_cours', 'cle_remise_temporairement'].includes(keyStatus)

  const prenom = profile?.prenom ?? ''

  return (
    <main className="min-h-screen bg-cream font-sans">
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto border-b border-sand">
        <a href="/" className="text-navy font-semibold text-xl tracking-tight">Cléo</a>
        <form action="/api/logout" method="POST">
          <button className="text-muted text-sm hover:text-navy transition-colors">
            Déconnexion
          </button>
        </form>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {searchParams.success && (
          <div className="bg-sage/20 border border-sage text-navy rounded-2xl px-6 py-4 mb-8 text-sm">
            ✅ Paiement confirmé — votre abonnement est en cours d&apos;activation.
          </div>
        )}

        <h1 className="text-navy text-3xl font-bold mb-8">
          {prenom ? `Bonjour ${prenom}` : 'Mon espace'}
        </h1>

        {/* ── PAS D'ABONNEMENT ── */}
        {!isActive && !isPendingActivation && (
          <div className="bg-sand rounded-2xl p-8 mb-6">
            <h2 className="text-navy font-semibold text-lg mb-2">Votre compte est créé</h2>
            <p className="text-muted text-sm mb-6">
              Activez votre espace en choisissant une formule. Vous pourrez ensuite organiser le dépôt de vos clés.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/inscription?plan=monthly"
                className="flex-1 text-center bg-navy text-cream py-3 px-6 rounded-full font-medium text-sm hover:bg-steel transition-colors"
              >
                Mensuel — 15 €/mois
              </a>
              <a
                href="/inscription?plan=annual"
                className="flex-1 text-center border border-navy text-navy py-3 px-6 rounded-full font-medium text-sm hover:bg-sand transition-colors"
              >
                Annuel — 150 €/an
              </a>
            </div>
          </div>
        )}

        {/* ── ACTIVATION EN COURS ── */}
        {isPendingActivation && (
          <div className="bg-sand rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sage animate-pulse"></div>
              <p className="text-navy text-sm font-medium">Abonnement en cours d&apos;activation…</p>
            </div>
            <p className="text-muted text-xs mt-2 ml-5">Cela prend généralement moins d&apos;une minute.</p>
          </div>
        )}

        {/* ── ABONNEMENT ACTIF ── */}
        {isActive && (
          <div className="bg-sand rounded-2xl p-6 mb-6">
            <h2 className="text-navy font-semibold mb-3">Abonnement</h2>
            <span className="inline-block bg-sage/30 text-navy text-xs font-medium px-3 py-1 rounded-full mb-3">
              ✓ Actif — {subscription.plan === 'monthly' ? 'Formule Mensuelle' : 'Formule Annuelle'}
            </span>
            <div className="space-y-0.5">
              {subscription.current_period_start && (
                <p className="text-muted text-xs">Depuis le {fmt(subscription.current_period_start)}</p>
              )}
              {subscription.current_period_end && (
                <p className="text-muted text-xs">Renouvellement le {fmt(subscription.current_period_end)}</p>
              )}
              {subscription.recovery_count_used !== undefined && (
                <p className="text-muted text-xs">
                  Récupérations utilisées : {subscription.recovery_count_used}/2 cette année
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── SECTION CLÉ ── */}
        {isActive && (
          <div className="bg-sand rounded-2xl p-6 mb-6">
            <h2 className="text-navy font-semibold mb-4">Ma clé</h2>

            {/* Aucune clé → organiser le dépôt */}
            {(!primarySlot || keyStatus === 'aucune_deposee') && (
              <div>
                <p className="text-muted text-sm mb-5">
                  Votre abonnement est actif. Il ne vous reste plus qu&apos;à nous confier votre clé.
                </p>
                <a
                  href="/dashboard/depot"
                  className="inline-block bg-navy text-cream px-6 py-3 rounded-full font-medium text-sm hover:bg-steel transition-colors"
                >
                  Organiser le dépôt de ma clé →
                </a>
              </div>
            )}

            {/* Dépôt en cours */}
            {primarySlot && ['depot_a_organiser', 'depot_planifie', 'cle_recue'].includes(keyStatus) && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔑</span>
                <div>
                  <p className="text-navy text-sm font-medium">
                    {primarySlot.label || `Clé #${primarySlot.slot_number}`}
                  </p>
                  <p className="text-muted text-xs">{KEY_STATUS_LABELS[keyStatus] ?? keyStatus}</p>
                  {keyStatus === 'depot_a_organiser' && (
                    <p className="text-muted text-xs mt-0.5">
                      Nous vous contacterons sous 48h pour confirmer le créneau.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Clé stockée → CTAs */}
            {isKeyStored && !isSinistreActive && !isRestitutionInProgress && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-2xl">🔑</span>
                  <div>
                    <p className="text-navy text-sm font-medium">
                      {primarySlot!.label || `Clé #${primarySlot!.slot_number}`}
                    </p>
                    <p className="text-muted text-xs">{KEY_STATUS_LABELS[keyStatus] ?? keyStatus}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/dashboard/sinistre"
                    className="flex-1 text-center bg-navy text-cream py-3 px-6 rounded-full font-medium text-sm hover:bg-steel transition-colors"
                  >
                    J&apos;ai besoin de ma clé
                  </a>
                  <a
                    href="/dashboard/restitution"
                    className="flex-1 text-center border border-muted/30 text-muted py-3 px-6 rounded-full text-xs font-medium hover:border-navy hover:text-navy transition-colors"
                  >
                    Résilier et récupérer ma clé
                  </a>
                </div>
              </div>
            )}

            {/* Sinistre actif */}
            {isSinistreActive && (
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🚨</span>
                <div>
                  <p className="text-navy text-sm font-medium">Intervention en cours</p>
                  <p className="text-muted text-xs">{KEY_STATUS_LABELS[keyStatus] ?? keyStatus}</p>
                  <p className="text-muted text-xs mt-1">
                    Notre équipe traite votre demande. Nous vous contacterons très prochainement.
                  </p>
                </div>
              </div>
            )}

            {/* Restitution en cours */}
            {isRestitutionInProgress && (
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">📦</span>
                <div>
                  <p className="text-navy text-sm font-medium">Restitution définitive demandée</p>
                  <p className="text-muted text-xs">{KEY_STATUS_LABELS[keyStatus] ?? keyStatus}</p>
                  <p className="text-muted text-xs mt-1">
                    Nous vous contacterons pour confirmer le rendez-vous de remise.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-muted text-xs text-center mt-4">
          Une question ?{' '}
          <a href="mailto:bonjour@merci-cleo.fr" className="text-navy underline">bonjour@merci-cleo.fr</a>
          {' '}— 09 72 11 05 64
        </p>

      </div>
    </main>
  )
}
