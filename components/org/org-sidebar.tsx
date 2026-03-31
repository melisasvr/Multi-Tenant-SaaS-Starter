'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useOrg, useRole } from './org-provider'
import { createClient } from '@/lib/supabase/client'
import { canManageBilling } from '@/lib/rbac'

export function OrgSidebar() {
  const { org, allOrgs, user } = useOrg()
  const role = useRole()
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { label: 'Dashboard', href: `/${org.slug}/dashboard` },
    { label: 'Members', href: `/${org.slug}/settings/members` },
    ...(canManageBilling(role)
      ? [{ label: 'Billing', href: `/${org.slug}/settings/billing` }]
      : []),
  ]

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Org switcher */}
      <div className="p-4 border-b border-gray-100">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Organization
        </div>
        <select
          className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none cursor-pointer"
          value={org.slug}
          onChange={(e) => router.push(`/${e.target.value}/dashboard`)}
        >
          {allOrgs.map((o) => (
            <option key={o.id} value={o.slug}>{o.name}</option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + sign out */}
      <div className="p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 truncate mb-2">{user.email}</div>
        <button
          onClick={signOut}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
