'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'main_propre' | 'operateur_agree' | 'a_organiser'

export default function DepotPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [mode, setMode] = useState<Mode | ''>('')
  const [form, setForm] = useState({
    label: '',
    nombre: '1',
    instructions: '',
    creneaux: '',
    lieu_alternatif: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/depot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, ...form }),
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

        {/* Progress */}
        {step < 3 && (
          <div className="flex gap-2 mb-8">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${step >= s ? 'bg-navy' : 'bg-sand'}`}
              />
            ))}
          </div>
        )}

        {/* ── ÉTAPE 1 — Mode de remise ── */}
        {step === 1 && (
          <>
            <h1 className="text-navy text-2xl font-bold mb-2">Dépôt de votre clé</h1>
            <p className="text-muted text-sm mb-8">Comment souhaitez-vous nous remettre votre clé ?</p>

            <div className="space-y-3 mb-8">
              {([
                { value: 'main_propre', label: 'Je souhaite remettre ma clé en main propre', desc: 'Vous venez déposer votre clé dans nos locaux parisiens.' },
                { value: 'operateur_agree', label: 'Je souhaite qu\'un opérateur agréé vienne la récupérer', desc: 'Nous envoyons un prestataire à votre adresse.' },
                { value: 'a_organiser', label: 'Je souhaite être recontacté pour organiser le dépôt', desc: 'Nous vous appelons sous 48h pour convenir d\'un créneau.' },
              ] as { value: Mode; label: string; desc: string }[]).map((opt) => (
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

            <button
              onClick={() => mode && setStep(2)}
              disabled={!mode}
              className="w-full bg-navy text-cream py-4 rounded-full font-medium text-sm hover:bg-steel transition-colors disabled:opacity-40"
            >
              Suivant →
            </button>
          </>
        )}

        {/* ── ÉTAPE 2 — Informations complémentaires ── */}
        {step === 2 && (
          <>
            <h1 className="text-navy text-2xl font-bold mb-2">Informations complémentaires</h1>
            <p className="text-muted text-sm mb-8">Ces détails nous aideront à préparer la prise en charge.</p>

            <div className="space-y-5">
              <div>
                <label className="text-navy text-sm font-medium block mb-1.5">
                  Nom ou label de la clé
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => set('label', e.target.value)}
                  placeholder='ex : "Appartement Paris 11e"'
                  className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="text-navy text-sm font-medium block mb-1.5">Nombre de clés</label>
                <select
                  value={form.nombre}
                  onChange={(e) => set('nombre', e.target.value)}
                  className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {(mode === 'main_propre' || mode === 'operateur_agree') && (
                <div>
                  <label className="text-navy text-sm font-medium block mb-1.5">Créneaux disponibles</label>
                  <textarea
                    value={form.creneaux}
                    onChange={(e) => set('creneaux', e.target.value)}
                    placeholder="ex : Lundi et mercredi après 18h, samedi matin"
                    rows={2}
                    className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy resize-none"
                  />
                </div>
              )}

              {mode === 'operateur_agree' && (
                <div>
                  <label className="text-navy text-sm font-medium block mb-1.5">
                    Lieu de remise (si différent de votre adresse principale)
                  </label>
                  <input
                    type="text"
                    value={form.lieu_alternatif}
                    onChange={(e) => set('lieu_alternatif', e.target.value)}
                    placeholder="Adresse de dépôt différente"
                    className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy"
                  />
                </div>
              )}

              <div>
                <label className="text-navy text-sm font-medium block mb-1.5">
                  Instructions particulières
                  <span className="text-muted font-normal"> (facultatif)</span>
                </label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => set('instructions', e.target.value)}
                  placeholder="Digicode, interphone, précisions…"
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
                disabled={loading}
                className="flex-1 bg-navy text-cream py-4 rounded-full font-medium text-sm hover:bg-steel transition-colors disabled:opacity-60"
              >
                {loading ? 'Enregistrement…' : 'Valider'}
              </button>
            </div>
          </>
        )}

        {/* ── ÉTAPE 3 — Confirmation ── */}
        {step === 3 && (
          <div className="text-center py-8">
            <div className="text-5xl mb-5">✅</div>
            <h1 className="text-navy text-2xl font-bold mb-3">Demande enregistrée</h1>
            <p className="text-muted text-sm leading-relaxed mb-2 max-w-sm mx-auto">
              {mode === 'a_organiser'
                ? 'Nous vous contacterons sous 48h pour organiser le dépôt de votre clé.'
                : 'Nous vous contacterons sous 48h pour confirmer le créneau de remise.'}
            </p>
            {form.label && (
              <p className="text-muted text-xs mb-8">Clé enregistrée : {form.label}</p>
            )}
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
