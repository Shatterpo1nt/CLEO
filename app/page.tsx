'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const plans = [
  {
    id: 'monthly' as const,
    label: 'Mensuel',
    price: '15',
    period: '/mois',
    sub: 'Premier mois offert',
    description: 'Pour essayer Cléo en toute liberté.',
    badge: null,
    features: [
      'Premier mois offert',
      'Sans engagement',
      '2 récupérations incluses par an',
      'Livraison express en option (15–25 €)',
      'Résiliable en deux clics, à tout moment',
      'Remboursement intégral sous 30 jours',
    ],
    cta: 'Commencer en mensuel',
    highlight: false,
  },
  {
    id: 'annual' as const,
    label: 'Annuel',
    price: '150',
    period: '/an',
    sub: 'Soit 12,50 € / mois',
    description: 'La formule sereine, à 12,50 € / mois.',
    badge: 'Recommandé',
    features: [
      '2 récupérations incluses par an',
      '1 récupération physique offerte',
      'Priorité sur les créneaux de dépôt',
      'Livraison express en option (15–25 €)',
      'Remboursement intégral sous 30 jours',
    ],
    cta: "Choisir l'annuel",
    highlight: true,
  },
]

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null)

  async function handleCheckout(plan: 'monthly' | 'annual') {
    setLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else if (res.status === 401) {
        router.push('/login')
      } else {
        alert('Une erreur est survenue. Réessaie.')
      }
    } catch {
      alert('Une erreur est survenue. Réessaie.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen bg-cream font-sans">

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <span className="text-navy font-semibold text-xl tracking-tight">Cléo</span>
        <div className="flex gap-4 items-center">
          <a href="/login" className="text-muted text-sm hover:text-navy transition-colors">
            Connexion
          </a>
          <a
            href="#pricing"
            className="bg-navy text-cream text-sm px-4 py-2 rounded-pill hover:bg-steel transition-colors"
          >
            Commencer
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <p className="text-sage text-sm font-medium uppercase tracking-widest mb-4">
          Service de garde-clés à Paris
        </p>
        <h1 className="text-navy text-5xl md:text-6xl font-bold leading-tight mb-6">
          Vos clés en sécurité,<br />
          <span className="text-steel">accessibles 24h/24</span>
        </h1>
        <p className="text-muted text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Confiez vos doubles à Cléo. Nous les gardons dans notre coffre sécurisé
          et les remettons à qui vous désignez, quand vous en avez besoin.
        </p>
        <a
          href="#pricing"
          className="inline-block bg-navy text-cream px-8 py-4 rounded-pill text-base font-medium hover:bg-steel transition-colors"
        >
          Confier mes clés →
        </a>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-sand py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-navy text-3xl font-bold text-center mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Déposez vos clés',
                desc: 'Prenez rendez-vous et déposez vos doubles en main propre dans nos locaux parisiens.',
              },
              {
                step: '02',
                title: 'On les garde',
                desc: 'Vos clés sont numérotées et stockées dans un coffre sécurisé. Vous gérez tout depuis votre espace.',
              },
              {
                step: '03',
                title: 'Récupérez à la demande',
                desc: 'Désignez quelqu\'un ou récupérez-les vous-même. On intervient en quelques heures.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-cream rounded-2xl p-8">
                <span className="text-sage text-4xl font-bold block mb-4">{step}</span>
                <h3 className="text-navy text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 max-w-5xl mx-auto px-6">
        <h2 className="text-navy text-3xl font-bold text-center mb-3">
          Deux formules, sans engagement.
        </h2>
        <p className="text-muted text-center mb-12 max-w-lg mx-auto">
          Vous pouvez retirer votre clé et résilier à tout moment. Le premier mois est
          offert pour vous laisser le temps d'essayer en toute simplicité.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-navy text-cream'
                  : 'bg-sand text-navy'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold uppercase tracking-widest ${plan.highlight ? 'text-steel' : 'text-muted'}`}>
                  {plan.label}
                </span>
                {plan.badge && (
                  <span className="border border-cream/40 text-cream text-xs px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}
              </div>

              <p className={`text-sm mb-5 ${plan.highlight ? 'text-steel' : 'text-muted'}`}>
                {plan.description}
              </p>

              {/* Price */}
              <div className="flex items-end gap-1 mb-1">
                <span className="text-5xl font-bold">{plan.price} €</span>
                <span className={`text-sm mb-2 ${plan.highlight ? 'text-steel' : 'text-muted'}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`text-sm mb-6 ${plan.highlight ? 'text-steel' : 'text-muted'}`}>
                {plan.sub}
              </p>

              {/* Features */}
              <ul className={`text-sm space-y-2 mb-8 flex-1 ${plan.highlight ? 'text-steel' : 'text-muted'}`}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-sage mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading !== null}
                className={`w-full py-3 rounded-full font-medium text-sm transition-colors disabled:opacity-60 ${
                  plan.highlight
                    ? 'bg-cream text-navy hover:bg-sand'
                    : 'bg-navy text-cream hover:bg-steel'
                }`}
              >
                {loading === plan.id ? 'Redirection...' : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-sand py-10 text-center text-muted text-sm">
        <p>© {new Date().getFullYear()} Cléo — Paris</p>
        <p className="mt-1">
          <a href="mailto:bonjour@merci-cleo.fr" className="hover:text-navy transition-colors">
            bonjour@merci-cleo.fr
          </a>
        </p>
        <p className="mt-1">09 72 11 05 64</p>
      </footer>

    </main>
  )
}
