'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from '@/types'
import { canChangeRole } from '@/lib/rbac'

interface MemberRow {
  id: string
  user_id: string
  role: string
  joined_at: string
  profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
}

interface InviteRow {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
}

interface Props {
  memberships: MemberRow[]
  invites: InviteRow[]
  currentUserId: string
  currentRole: Role
  orgId: string
  orgSlug: string
}

export function MembersTable({ memberships, invites, currentUserId, currentRole, orgId, orgSlug }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function removeMember(membershipId: string) {
    if (!confirm('Remove this member?')) return
    setBusy(membershipId)
    await fetch(`/api/memberships/${membershipId}`, { method: 'DELETE' })
    router.refresh()
    setBusy(null)
  }

  async function changeRole(membershipId: string, newRole: Role) {
    setBusy(membershipId)
    await fetch(`/api/memberships/${membershipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    router.refresh()
    setBusy(null)
  }

  async function revokeInvite(inviteId: string) {
    setBusy(inviteId)
    await fetch(`/api/invites/${inviteId}`, { method: 'DELETE' })
    router.refresh()
    setBusy(null)
  }

  return (
    <div className="space-y-6">
      {/* Active members */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Members <span className="text-gray-400 font-normal ml-1">({memberships.length})</span>
          </h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {memberships.map((m) => {
            const isSelf = m.user_id === currentUserId
            const canEdit = !isSelf && canChangeRole(currentRole, m.role as Role, m.role as Role)
            return (
              <li key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium shrink-0">
                  {(m.profiles?.full_name ?? 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {m.profiles?.full_name ?? 'Unknown'}
                    {isSelf && <span className="text-gray-400 font-normal ml-1">(you)</span>}
                  </div>
                </div>
                <span className={`badge-${m.role}`}>{m.role}</span>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <select
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                      value={m.role}
                      disabled={busy === m.id}
                      onChange={(e) => changeRole(m.id, e.target.value as Role)}
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
                    <button
                      onClick={() => removeMember(m.id)}
                      disabled={busy === m.id}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Pending invites <span className="text-gray-400 font-normal ml-1">({invites.length})</span>
            </h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400 shrink-0">
                  ✉
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-700 truncate">{invite.email}</div>
                  <div className="text-xs text-gray-400">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <span className={`badge-${invite.role}`}>{invite.role}</span>
                {(currentRole === 'owner' || currentRole === 'admin') && (
                  <button
                    onClick={() => revokeInvite(invite.id)}
                    disabled={busy === invite.id}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
