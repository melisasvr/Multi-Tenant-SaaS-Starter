import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrgSidebar } from '@/components/org/org-sidebar'
import { OrgProvider } from '@/components/org/org-provider'

interface Props {
  children: React.ReactNode
  params: Promise<{ org: string }>
}

export default async function OrgLayout({ children, params }: Props) {
  const { org: slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Fetch org + membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('*, organizations!inner(*)')
    .eq('user_id', user.id)
    .eq('organizations.slug', slug)
    .single()

  if (!membership) redirect('/')

  const org = membership.organizations as any

  // Fetch all user orgs for switcher
  const { data: allMemberships } = await supabase
    .from('memberships')
    .select('role, organizations(id, name, slug)')
    .eq('user_id', user.id)

  // Fetch subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('org_id', org.id)
    .single()

  const context = {
    org,
    membership: { ...membership, user: { id: user.id, email: user.email! } },
    subscription: subscription ?? null,
    allOrgs: (allMemberships ?? []).map((m: any) => m.organizations),
    user,
  }

  return (
    <OrgProvider value={context}>
      <div className="flex h-screen bg-gray-50">
        <OrgSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </OrgProvider>
  )
}
