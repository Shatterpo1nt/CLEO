import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { success?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: keySlots } = await supabase
    .from('key_slots')
    .select('*')
    .eq('user_id', user.id)

  const isActive = subscription?.status === 'active'

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
            ✅ Paiement confirmé ! Bienvenue chez Cléo.
          </div>
        )}

        <h1 className="text-navy text-3xl font-bold mb-8">
          Mon espace
        </h1>

        {/* Subscription status */}
        <div className="bg-sand rounded-2xl p-6 mb-6">
          <h2 className="text-navy font-semibold mb-2">Abonnement</h2>
          {isActive ? (
            <div>
              <span className="inline-block bg-sage/30 text-navy text-xs font-medium px-3 py-1 rounded-pill">
                ✓ Actif — Plan {subscription.plan === 'monthly' ? 'Mensuel' : 'Annuel'}
              </span>
              {subscription.current_period_end && (
                <p className="text-muted text-sm mt-2">
                  Prochain renouvellement :{' '}
                  {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          ) : (
            <div>
              <span className="inline-block bg-sand border border-muted/30 text-muted text-xs px-3 py-1 rounded-pill">
                Aucun abonnement actif
              </span>
              <p className="text-muted text-sm mt-3">
                <a href="/#pricing" className="text-steel underline">
                  Choisir un plan →
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Key slots */}
        <div className="bg-sand rounded-2xl p-6">
          <h2 className="text-navy font-semibold mb-4">Mes clés</h2>
          {keySlots && keySlots.length > 0 ? (
            <ul className="space-y-3">
              {keySlots.map((slot) => (
                <li key={slot.id} className="flex items-center gap-3 bg-cream rounded-xl px-4 py-3">
                  <span className="text-2xl">🔑</span>
                  <div>
                    <p className="text-navy text-sm font-medium">
                      {slot.label || `Clé #${slot.slot_number}`}
                    </p>
                    <p className="text-muted text-xs">
                      Déposée le {new Date(slot.assigned_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-sm">
              Aucune clé déposée pour l&apos;instant.
              {isActive ? ' Contacte-nous pour organiser le dépôt.' : ' Active ton abonnement pour commencer.'}
            </p>
          )}
        </div>

      </div>
    </main>
  )
}
