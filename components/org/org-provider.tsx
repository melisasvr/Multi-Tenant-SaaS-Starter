'use client'

import { createContext, useContext } from 'react'
import type { Organization, Membership, Subscription, Role } from '@/types'

interface OrgContextValue {
  org: Organization
  membership: Membership & { user: { id: string; email: string } }
  subscription: Subscription | null
  allOrgs: Organization[]
  user: { id: string; email?: string }
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrgProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: OrgContextValue
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg must be used inside OrgProvider')
  return ctx
}

export function useRole(): Role {
  return useOrg().membership.role as Role
}
