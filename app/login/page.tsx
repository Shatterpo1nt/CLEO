'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
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
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <a href="/" className="text-navy font-semibold text-xl tracking-tight mb-10">
        Cléo
      </a>

      <div className="bg-sand rounded-2xl p-8 w-full max-w-sm">
        {sent ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="text-navy font-semibold text-lg mb-2">Vérifie tes emails</h2>
            <p className="text-muted text-sm">
              Un lien de connexion a été envoyé à <strong>{email}</strong>.
              Clique dessus pour accéder à ton espace.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-navy font-bold text-2xl mb-1">Connexion</h1>
            <p className="text-muted text-sm mb-6">On t&apos;envoie un lien magique par email.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-navy text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="toi@exemple.fr"
                  className="w-full bg-cream border border-sand rounded-xl px-4 py-3 text-navy text-sm placeholder-muted/50 focus:outline-none focus:border-steel transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-500 text-xs">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-cream py-3 rounded-pill text-sm font-medium hover:bg-steel transition-colors disabled:opacity-60"
              >
                {loading ? 'Envoi...' : 'Recevoir le lien'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
