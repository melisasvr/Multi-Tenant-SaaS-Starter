import { createClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ org: string }>
}

export async function generateMetadata({ params }: Props) {
  const { org } = await params
  return { title: `Dashboard — ${org}` }
}

export default async function DashboardPage({ params }: Props) {
  const { org: slug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('*, memberships(count), subscriptions(*)')
    .eq('slug', slug)
    .single()

  const memberCount = (org?.memberships as any)?.[0]?.count ?? 0
  const subscription = (org?.subscriptions as any)?.[0] ?? null

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{org?.name}</h1>
      <p className="text-sm text-gray-500 mb-8">/{slug}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="card p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Members</div>
          <div className="text-3xl font-bold text-gray-900">{memberCount}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Plan</div>
          <div className="text-3xl font-bold text-gray-900 capitalize">
            {subscription?.plan ?? 'Free'}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</div>
          <div className="text-3xl font-bold text-gray-900 capitalize">
            {subscription?.status ?? 'Active'}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Getting started</h2>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span> Organization created
          </li>
          <li className="flex items-center gap-2">
            <span className="text-brand-500">→</span>
            <a href={`/${slug}/settings/members`} className="text-brand-600 hover:underline">
              Invite your team
            </a>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-brand-500">→</span>
            <a href={`/${slug}/settings/billing`} className="text-brand-600 hover:underline">
              Upgrade your plan
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}
