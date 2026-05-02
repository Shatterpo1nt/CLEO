'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes('not found') || error.status === 422) {
        setError("Aucun compte n'est associé à cette adresse. Vous pouvez souscrire depuis la page d'accueil.")
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.')
      }
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 font-sans">
      <a href="/" className="text-navy font-semibold text-xl tracking-tight mb-10">
        Cléo
      </a>

      <div className="bg-sand rounded-2xl p-8 w-full max-w-sm">
        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-navy font-semibold text-lg mb-2">Vérifiez votre adresse email</h2>
            <p className="text-muted text-sm leading-relaxed">
              Un lien de connexion a été envoyé à <strong>{email}</strong>.
              Cliquez dessus pour accéder à votre espace Cléo.
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="mt-6 text-muted text-xs underline hover:text-navy transition-colors"
            >
              Utiliser une autre adresse
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-navy font-semibold text-lg mb-1">Accédez à votre espace Cléo</h1>
            <p className="text-muted text-sm mb-6">
              Entrez votre adresse email pour recevoir votre lien de connexion.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-navy text-sm font-medium block mb-1.5">Adresse email</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.fr"
                  className="w-full bg-cream border border-muted/20 rounded-xl px-4 py-3 text-navy text-sm focus:outline-none focus:border-navy transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-600 text-xs leading-relaxed">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-cream py-3 rounded-full font-medium text-sm hover:bg-steel transition-colors disabled:opacity-60"
              >
                {loading ? 'Envoi…' : 'Recevoir le lien'}
              </button>
            </form>

            <p className="text-center text-muted text-xs mt-5">
              Pas encore client ?{' '}
              <a href="/#pricing" className="text-navy underline">Découvrir Cléo</a>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
