import { createClient } from '@/lib/supabase/server'
import { MembersTable } from '@/components/org/members-table'
import { InviteForm } from '@/components/org/invite-form'

interface Props {
  params: Promise<{ org: string }>
}

export const metadata = { title: 'Members' }

export default async function MembersPage({ params }: Props) {
  const { org: slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', slug)
    .single()

  const { data: memberships } = await supabase
    .from('memberships')
    .select('id, role, joined_at, user_id, profiles:profiles(id, full_name, avatar_url)')
    .eq('org_id', org!.id)
    .order('joined_at')

  // Normalize profiles from array to single object (Supabase returns array for joins)
  const normalizedMemberships = (memberships ?? []).map((m) => ({
    ...m,
    profiles: Array.isArray(m.profiles) ? (m.profiles[0] ?? null) : m.profiles,
  }))

  const { data: invites } = await supabase
    .from('invites')
    .select('id, email, role, expires_at, created_at')
    .eq('org_id', org!.id)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const currentMembership = memberships?.find((m) => m.user_id === user?.id)
  const currentRole = currentMembership?.role ?? 'member'

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage who has access to {org?.name}.
          </p>
        </div>
        {(currentRole === 'owner' || currentRole === 'admin') && (
          <InviteForm orgId={org!.id} orgSlug={slug} />
        )}
      </div>

      <MembersTable
        memberships={normalizedMemberships}
        invites={invites ?? []}
        currentUserId={user!.id}
        currentRole={currentRole as any}
        orgId={org!.id}
        orgSlug={slug}
      />
    </div>
  )
}
