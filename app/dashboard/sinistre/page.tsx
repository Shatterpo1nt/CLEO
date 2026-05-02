'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Urgence = 'critique' | 'urgent' | 'planifie'

const URGENCE_CONFIG = {
  critique: {
    label: 'Critique',
    desc: 'Je suis bloqué dehors maintenant',
    delai: 'Nous vous rappelons dans les 30 minutes.',
    emoji: '🚨',
  },
  urgent: {
    label: 'Urgent',
    desc: "J'ai besoin de ma clé aujourd'hui",
    delai: 'Nous vous contactons dans les 2 heures.',
    emoji: '⚡',
  },
  planifie: {
    label: 'Planifié',
    desc: "J'ai besoin de ma clé à une date précise",
    delai: 'Nous confirmons votre créneau sous 24 heures.',
    emoji: '📅',
  },
}

export default function SinistrePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [urgence, setUrgence] = useState<Urgence | ''>('')
  const [form, setForm] = useState({
    adresse_remise: '',
    telephone_joignable: '',
    personne_remise: '',
    creneau_souhaite: '',
    contexte: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sinistre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urgence, ...form }),
      })
      const data = await res.json()
      if (data.ok) {
        setStep(3)
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

        {step < 3 && (
          <div className="flex gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-navy' : 'bg-sand'}`} />
            ))}
          </div>
        )}

        {/* ── ÉTAPE 1 — Niveau d'urgence ── */}
        {step === 1 && (
          <>
            <h1 className="text-navy text-2xl font-bold mb-2">Besoin de votre clé</h1>
            <p className="text-muted text-sm mb-8">Quel est votre niveau d&apos;urgence ?</p>

            <div className="space-y-3 mb-8">
              {(Object.entries(URGENCE_CONFIG) as [Urgence, typeof URGENCE_CONFIG[Urgence]][]).map(([value, cfg]) => (
                <label
                  key={value}
                  className={`block rounded-2xl p-5 cursor-pointer border-2 transition-colors ${
                    urgence === value ? 'border-navy bg-sand' : 'border-sand bg-sand hover:border-muted/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="urgence"
                      value={value}
                      checked={urgence === value}
                      onChange={() => setUrgence(value)}
                      className="mt-1 accent-navy"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{cfg.emoji}</span>
                        <p className="text-navy text-sm font-semibold">{cfg.label}</p>
                      </div>
                      <p className="text-muted text-xs mt-0.5">{cfg.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={() => urgence && setStep(2)}
              disabled={!urgence}
              className="w-full bg-navy text-cream py-4 rounded-full font-medium text-sm hover:bg-steel transition-colors disabled:opacity-40"
            >
              Suivant →
            </button>
          </>
        )}

        {/* ── ÉTAPE 2 — Informations d'intervention ── */}
        {step === 2 && urgence && (
          <>
            <h1 className="text-navy text-2xl font-bold mb-2">Informations d&apos;intervention</h1>
            <p className="text-muted text-sm mb-8">
              Ces informations permettront à notre équipe de traiter votre demande rapidement.
            </p>

            <div className="space-y-5">
              <div>
                <label className="text-navy text-sm font-medium block mb-1.5">
                  Téléphone joignable immédiatement *
                </label>
                <input
                  required
                  type="tel"
                  value={form.telephone_joignable}
                  onChange={(e) => set('telephone_joignable', e.target.value)}
                  placeholder="06 12 34 56 78"
                  className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="text-navy text-sm font-medium block mb-1.5">
                  Adresse de remise *
                </label>
                <input
                  required
                  type="text"
                  value={form.adresse_remise}
                  onChange={(e) => set('adresse_remise', e.target.value)}
                  placeholder="Adresse où vous souhaitez recevoir la clé"
                  className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="text-navy text-sm font-medium block mb-1.5">
                  Personne qui récupère la clé
                </label>
                <input
                  type="text"
                  value={form.personne_remise}
                  onChange={(e) => set('personne_remise', e.target.value)}
                  placeholder="Votre nom ou celui d'un tiers autorisé"
                  className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy"
                />
              </div>

              {urgence !== 'critique' && (
                <div>
                  <label className="text-navy text-sm font-medium block mb-1.5">
                    Créneau souhaité
                  </label>
                  <input
                    type="text"
                    value={form.creneau_souhaite}
                    onChange={(e) => set('creneau_souhaite', e.target.value)}
                    placeholder={urgence === 'planifie' ? 'ex : Vendredi 9 mai, entre 14h et 17h' : 'Dès que possible aujourd\'hui'}
                    className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy"
                  />
                </div>
              )}

              <div>
                <label className="text-navy text-sm font-medium block mb-1.5">
                  Contexte / informations complémentaires
                  <span className="text-muted font-normal"> (facultatif)</span>
                </label>
                <textarea
                  value={form.contexte}
                  onChange={(e) => set('contexte', e.target.value)}
                  placeholder="Décrivez brièvement la situation…"
                  rows={3}
                  className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-muted/30 text-muted py-4 rounded-full font-medium text-sm hover:border-navy hover:text-navy transition-colors"
              >
                ← Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !form.telephone_joignable || !form.adresse_remise}
                className="flex-1 bg-navy text-cream py-4 rounded-full font-medium text-sm hover:bg-steel transition-colors disabled:opacity-60"
              >
                {loading ? 'Envoi…' : 'Déclarer le sinistre'}
              </button>
            </div>
          </>
        )}

        {/* ── ÉTAPE 3 — Confirmation ── */}
        {step === 3 && urgence && (
          <div className="text-center py-8">
            <div className="text-5xl mb-5">{URGENCE_CONFIG[urgence].emoji}</div>
            <h1 className="text-navy text-2xl font-bold mb-3">Demande enregistrée</h1>
            <div className="bg-sand rounded-2xl px-6 py-5 mb-6 text-left">
              <p className="text-navy text-sm font-medium mb-1">
                Urgence : {URGENCE_CONFIG[urgence].label}
              </p>
              <p className="text-muted text-sm">{URGENCE_CONFIG[urgence].delai}</p>
            </div>
            <p className="text-muted text-xs mb-8">
              Notre équipe a été notifiée. Gardez votre téléphone à portée de main.
            </p>
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
