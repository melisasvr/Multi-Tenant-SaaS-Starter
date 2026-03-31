'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/'
  const prefillEmail = searchParams.get('email') ?? ''
  const inviteToken = searchParams.get('token')

  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If there's an invite token, redirect back to invite page to accept
    if (inviteToken) {
      router.push(`/invite?token=${inviteToken}`)
    } else {
      router.push(redirectTo)
    }
    router.refresh()
  }

  async function handleMagicLink() {
    if (!email) { setError('Enter your email first'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    })

    setLoading(false)
    if (error) setError(error.message)
    else setError('✓ Check your email for a magic link')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email" type="email" required autoComplete="email"
          className="input" value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input
          id="password" type="password" required autoComplete="current-password"
          className="input" value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className={`text-sm ${error.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <button
        type="button" onClick={handleMagicLink} disabled={loading}
        className="btn-secondary w-full justify-center"
      >
        Email me a magic link
      </button>
    </form>
  )
}
