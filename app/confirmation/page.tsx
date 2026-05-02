'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmationPage() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSending(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })

    if (err) {
      setError('Impossible d\'envoyer le lien. Vérifiez l\'adresse email.')
    } else {
      setSent(true)
    }
    setSending(false)
  }

  return (
    <main className="min-h-screen bg-cream font-sans flex flex-col items-center justify-center px-6">
      <a href="/" className="text-navy font-semibold text-xl tracking-tight mb-12">Cléo</a>

      <div className="bg-sand rounded-2xl p-10 w-full max-w-md text-center">
        <div className="text-5xl mb-5">✅</div>
        <h1 className="text-navy text-2xl font-bold mb-3">Paiement confirmé</h1>
        <p className="text-muted text-sm leading-relaxed mb-8">
          Votre abonnement est en cours d&apos;activation. Vérifiez votre adresse email —
          vous avez reçu un lien pour accéder à votre espace Cléo.
        </p>

        {sent ? (
          <div className="bg-sage/20 border border-sage rounded-xl px-5 py-4 text-navy text-sm">
            ✓ Lien envoyé — vérifiez votre boîte de réception.
          </div>
        ) : (
          <>
            <p className="text-muted text-xs mb-4">Vous n&apos;avez rien reçu ?</p>
            <form onSubmit={handleResend} className="space-y-3">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                className="w-full bg-cream border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
              />
              {error && <p className="text-red-600 text-xs">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-navy text-cream py-3 rounded-full font-medium text-sm hover:bg-steel transition-colors disabled:opacity-60"
              >
                {sending ? 'Envoi…' : 'Renvoyer le lien de connexion'}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="text-muted text-xs mt-8 text-center">
        Une question ? <a href="mailto:bonjour@merci-cleo.fr" className="text-navy underline">bonjour@merci-cleo.fr</a>
      </p>
    </main>
  )
}
