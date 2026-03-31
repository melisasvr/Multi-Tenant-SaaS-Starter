'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toSlug(str: string) {
    return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 48)
  }

  function handleNameChange(val: string) {
    setName(val)
    if (!slugTouched) setSlug(toSlug(val))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/orgs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      return
    }

    router.push(`/${data.org.slug}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create your workspace</h1>
          <p className="text-gray-500 mt-2">You can add teammates after setup.</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Organization name</label>
              <input
                type="text" required className="input" value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Acme Corp"
                autoFocus
              />
            </div>
            <div>
              <label className="label">URL slug</label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-sm text-gray-500">
                  app.com/
                </span>
                <input
                  type="text" required className="input rounded-l-none" value={slug}
                  onChange={(e) => { setSlug(toSlug(e.target.value)); setSlugTouched(true) }}
                  placeholder="acme-corp"
                  pattern="[a-z0-9-]+"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and hyphens only.</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Creating…' : 'Create workspace →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
