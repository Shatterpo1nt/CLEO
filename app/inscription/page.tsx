'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function InscriptionForm() {
  const searchParams = useSearchParams()
  const plan = (searchParams.get('plan') ?? 'monthly') as 'monthly' | 'annual'
  const reprise = searchParams.get('reprise') === 'true'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    type_logement: 'appartement',
    cgv: false,
    cgu: false,
    privacy: false,
  })

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.cgv || !form.cgu || !form.privacy) {
      setError("Veuillez accepter les conditions générales et la politique de confidentialité.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Une erreur est survenue. Veuillez réessayer.')
      }
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const planLabel = plan === 'monthly' ? 'Mensuel — 15 €/mois' : 'Annuel — 150 €/an'

  return (
    <main className="min-h-screen bg-cream font-sans">
      <nav className="flex items-center justify-between px-6 py-5 max-w-2xl mx-auto border-b border-sand">
        <a href="/" className="text-navy font-semibold text-xl tracking-tight">Cléo</a>
        <a href="/login" className="text-muted text-sm hover:text-navy transition-colors">
          Déjà client ? Connexion
        </a>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Plan recap */}
        <div className="bg-navy text-cream rounded-2xl px-6 py-4 mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs text-steel uppercase tracking-widest mb-1">Formule choisie</p>
            <p className="font-semibold">{planLabel}</p>
          </div>
          <a href="/#pricing" className="text-steel text-sm underline underline-offset-2">Modifier</a>
        </div>

        {reprise && (
          <div className="bg-sand border border-muted/20 text-navy rounded-2xl px-6 py-4 mb-6 text-sm">
            Votre compte existe déjà. Vous pouvez reprendre votre souscription.
          </div>
        )}

        <h1 className="text-navy text-2xl font-bold mb-2">Vos coordonnées</h1>
        <p className="text-muted text-sm mb-8">
          Ces informations nous permettront d&apos;organiser la garde et la remise de vos clés.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Identité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-navy text-sm font-medium block mb-1.5">Prénom *</label>
              <input
                required
                type="text"
                value={form.prenom}
                onChange={(e) => set('prenom', e.target.value)}
                placeholder="Marie"
                className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
              />
            </div>
            <div>
              <label className="text-navy text-sm font-medium block mb-1.5">Nom *</label>
              <input
                required
                type="text"
                value={form.nom}
                onChange={(e) => set('nom', e.target.value)}
                placeholder="Dupont"
                className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-navy text-sm font-medium block mb-1.5">Adresse email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="marie@example.com"
              className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
            />
            <p className="text-muted text-xs mt-1.5">
              Votre lien de connexion vous sera envoyé à cette adresse après paiement.
            </p>
          </div>

          {/* Téléphone */}
          <div>
            <label className="text-navy text-sm font-medium block mb-1.5">Téléphone *</label>
            <input
              required
              type="tel"
              value={form.telephone}
              onChange={(e) => set('telephone', e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="text-navy text-sm font-medium block mb-1.5">Adresse *</label>
            <input
              required
              type="text"
              value={form.adresse}
              onChange={(e) => set('adresse', e.target.value)}
              placeholder="12 rue de la Paix"
              className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-navy text-sm font-medium block mb-1.5">Ville *</label>
              <input
                required
                type="text"
                value={form.ville}
                onChange={(e) => set('ville', e.target.value)}
                placeholder="Paris"
                className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
              />
            </div>
            <div>
              <label className="text-navy text-sm font-medium block mb-1.5">Code postal *</label>
              <input
                required
                type="text"
                value={form.code_postal}
                onChange={(e) => set('code_postal', e.target.value)}
                placeholder="75001"
                className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
              />
            </div>
          </div>

          {/* Type de logement */}
          <div>
            <label className="text-navy text-sm font-medium block mb-1.5">Type de logement *</label>
            <select
              value={form.type_logement}
              onChange={(e) => set('type_logement', e.target.value)}
              className="w-full bg-sand border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
            >
              <option value="appartement">Appartement</option>
              <option value="maison">Maison</option>
              <option value="bureau">Bureau / Local professionnel</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          {/* Conditions */}
          <div className="bg-sand rounded-2xl p-5 space-y-3">
            <p className="text-navy text-sm font-medium mb-1">Conditions *</p>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.cgv}
                onChange={(e) => set('cgv', e.target.checked)}
                className="mt-0.5 accent-navy w-4 h-4 flex-shrink-0"
              />
              <span className="text-sm text-muted leading-relaxed">
                J&apos;ai lu et j&apos;accepte les{' '}
                <a href="/cgv" className="text-navy underline" target="_blank">conditions générales de vente</a>.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.cgu}
                onChange={(e) => set('cgu', e.target.checked)}
                className="mt-0.5 accent-navy w-4 h-4 flex-shrink-0"
              />
              <span className="text-sm text-muted leading-relaxed">
                J&apos;accepte les{' '}
                <a href="/cgu" className="text-navy underline" target="_blank">conditions générales d&apos;utilisation</a>.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.privacy}
                onChange={(e) => set('privacy', e.target.checked)}
                className="mt-0.5 accent-navy w-4 h-4 flex-shrink-0"
              />
              <span className="text-sm text-muted leading-relaxed">
                J&apos;accepte la{' '}
                <a href="/confidentialite" className="text-navy underline" target="_blank">politique de confidentialité</a>.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-cream py-4 rounded-full font-medium text-sm hover:bg-steel transition-colors disabled:opacity-60"
          >
            {loading ? 'Redirection vers le paiement…' : 'Continuer vers le paiement →'}
          </button>

          <p className="text-center text-muted text-xs">
            Paiement sécurisé par Stripe. Vous pouvez résilier à tout moment.
          </p>

        </form>
      </div>
    </main>
  )
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream flex items-center justify-center font-sans">
        <p className="text-muted text-sm">Chargement…</p>
      </main>
    }>
      <InscriptionForm />
    </Suspense>
  )
}
