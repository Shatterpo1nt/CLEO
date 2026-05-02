'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ModeRestitution = 'main_propre' | 'operateur_agree'

export default function RestitutionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [mode, setMode] = useState<ModeRestitution | ''>('')
  const [form, setForm] = useState({
    creneau_souhaite: '',
    adresse_remise: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/restitution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, ...form }),
      })
      const data = await res.json()
      if (data.ok) {
        setStep(4)
      } else {
        setError(data.error ?? 'Une erreur est survenue.')
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-cream font-sans">
      <nav className="flex items-center justify-between px-6 py-5 max-w-2xl mx-auto border-b border-sand">
        <a href="/" className="text-navy font-semibold text-xl tracking-tight">Cléo</a>
        <a href="/dashboard" className="text-muted text-sm hover:text-navy transition-colors">← Mon espace</a>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {step < 4 && (
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-navy' : 'bg-sand'}`} />
            ))}
          </div>
        )}

        {/* ── ÉTAPE 1 — Confirmation d'intention ── */}
        {step === 1 && (
          <>
            <h1 className="text-navy text-2xl font-bold mb-2">Résiliation et restitution de clé</h1>
            <div className="bg-sand rounded-2xl p-6 mb-8 space-y-2">
              <p className="text-navy text-sm leading-relaxed">
                Vous souhaitez mettre fin à votre abonnement Cléo et récupérer votre clé.
              </p>
              <p className="text-muted text-sm leading-relaxed">
                Cette démarche n&apos;est pas urgente. Nous organiserons la restitution dans les meilleurs délais.
                Votre abonnement restera actif jusqu&apos;à la fin de la période en cours.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/dashboard"
                className="flex-1 text-center border border-muted/30 text-muted py-4 rounded-full font-medium text-sm hover:border-navy hover:text-navy transition-colors"
              >
                Annuler
              </a>
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-navy text-cream py-4 rounded-full font-medium text-sm hover:bg-steel transition-colors"
              >
                Continuer
              </button>
            </div>
          </>
        )}

        {/* ── ÉTAPE 2 — Modalité de restitution ── */}
        {step === 2 && (
          <>
            <h1 className="text-navy text-2xl font-bold mb-2">Modalité de restitution</h1>
            <p className="text-muted text-sm mb-8">Comment souhaitez-vous récupérer votre clé ?</p>

            <div className="space-y-3 mb-8">
              {([
                { value: 'main_propre' as ModeRestitution, label: 'Je récupère ma clé en main propre', desc: 'Vous venez récupérer votre clé dans nos locaux parisiens.' },
                { value: 'operateur_agree' as ModeRestitution, label: "Je souhaite qu'un opérateur agréé me la rapporte", desc: 'Nous vous la remettons à votre adresse.' },
              ]).map((opt) => (
                <label
                  key={opt.value}
                  className={`block rounded-2xl p-5 cursor-pointer border-2 transition-colors ${
                    mode === opt.value ? 'border-navy bg-sand' : 'border-sand bg-sand hover:border-muted/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="mode"
                      value={opt.value}
                      checked={mode === opt.value}
                      onChange={() => setMode(opt.value)}
                      className="mt-1 accent-navy"
                    />
                    <div>
                      <p className="text-navy text-sm font-medium">{opt.label}</p>
                      <p className="text-muted text-xs mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-muted/30 text-muted py-4 rounded-full font-medium text-sm hover:border-navy hover:text-navy transition-colors">
                ← Retour
              </button>
              <button
                onClick={() => mode && setStep(3)}
                disabled={!mode}
                className="flex-1 bg-navy text-cream py-4 rounded-full font-medium text-sm hover:bg-steel transition-colors disabled:opacity-40"
              >
                Suivant →
              </button>
            </div>
          </>
        )}

        {/* ── ÉTAPE 3 — Créneau et identité ── */}
        {step === 3 && (
          <>
            <h1 className="text-navy text-2xl font-bold mb-2">Créneau et identité</h1>
            <p className="text-muted text-sm mb-8">
              Ces informations nous permettront de planifier la remise de votre clé.
            </p>

            <div className="space-y-5">
              <div>
                <label className="text-navy text-sm font-medium block mb-1.5">Créneau souhaité</label>
                <input
                  type="text"
                  value={form.creneau_souhaite}
                  onChange={(e) => set('creneau_souhaite', e.target.value)}
                  placeholder="ex : Semaine du 12 mai, après-midi"
                  className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy"
                />
              </div>

              {mode === 'operateur_agree' && (
                <div>
                  <label className="text-navy text-sm font-medium block mb-1.5">
                    Adresse de remise
                    <span className="text-muted font-normal"> (si différente de votre adresse principale)</span>
                  </label>
                  <input
                    type="text"
                    value={form.adresse_remise}
                    onChange={(e) => set('adresse_remise', e.target.value)}
                    placeholder="Adresse souhaitée"
                    className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(2)} className="flex-1 border border-muted/30 text-muted py-4 rounded-full font-medium text-sm hover:border-navy hover:text-navy transition-colors">
                ← Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-navy text-cream py-4 rounded-full font-medium text-sm hover:bg-steel transition-colors disabled:opacity-60"
              >
                {loading ? 'Enregistrement…' : 'Confirmer la restitution'}
              </button>
            </div>
          </>
        )}

        {/* ── ÉTAPE 4 — Confirmation finale ── */}
        {step === 4 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-5">📦</div>
            <h1 className="text-navy text-2xl font-bold mb-3">Demande enregistrée</h1>
            <div className="bg-sand rounded-2xl px-6 py-5 mb-6 text-left space-y-1">
              <p className="text-navy text-sm font-medium">Restitution définitive demandée</p>
              <p className="text-muted text-sm">Votre abonnement restera actif jusqu&apos;à la fin de la période en cours.</p>
              <p className="text-muted text-sm">Nous vous contacterons pour confirmer le rendez-vous.</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-navy text-cream px-8 py-3 rounded-full font-medium text-sm hover:bg-steel transition-colors"
            >
              Revenir à mon espace
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
