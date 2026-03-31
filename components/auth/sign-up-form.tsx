'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillEmail = searchParams.get('email') ?? ''
  const inviteToken = searchParams.get('token')

  const [name, setName] = useState('')
  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (inviteToken) {
      router.push(`/invite?token=${inviteToken}`)
    } else {
      router.push('/onboarding')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">Full name</label>
        <input
          id="name" type="text" required autoComplete="name"
          className="input" value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
        />
      </div>
      <div>
        <label htmlFor="email" className="label">Work email</label>
        <input
          id="email" type="email" required autoComplete="email"
          className="input" value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input
          id="password" type="password" required minLength={8}
          autoComplete="new-password"
          className="input" value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
