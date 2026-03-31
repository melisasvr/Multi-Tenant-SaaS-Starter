'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  orgId: string
  orgSlug: string
}

export function InviteForm({ orgId, orgSlug }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ inviteUrl?: string; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, orgId }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setResult({ error: data.error ?? 'Something went wrong' })
      return
    }

    setResult({ inviteUrl: data.inviteUrl })
    setEmail('')
    router.refresh()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        Invite member
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Invite a teammate</h2>
          <button onClick={() => { setOpen(false); setResult(null) }} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {result?.inviteUrl ? (
          <div>
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              Invite created! Share this link with your teammate:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-700 break-all mb-4">
              {result.inviteUrl}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(result.inviteUrl!)}
                className="btn-secondary flex-1"
              >
                Copy link
              </button>
              <button onClick={() => setResult(null)} className="btn-primary flex-1">
                Invite another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email" required className="input" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input" value={role}
                onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
              >
                <option value="member">Member — can view content</option>
                <option value="admin">Admin — can invite and manage members</option>
              </select>
            </div>
            {result?.error && <p className="text-sm text-red-600">{result.error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
