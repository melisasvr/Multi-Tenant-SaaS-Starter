import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BillingPanel } from '@/components/billing/billing-panel'

interface Props {
  params: Promise<{ org: string }>
}

export const metadata = { title: 'Billing' }

export default async function BillingPage({ params }: Props) {
  const { org: slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', slug)
    .single()

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('org_id', org!.id)
    .eq('user_id', user.id)
    .single()

  if (membership?.role !== 'owner') {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing</h1>
        <div className="card p-6">
          <p className="text-sm text-gray-500">
            Only the organization owner can manage billing.
          </p>
        </div>
      </div>
    )
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('org_id', org!.id)
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Billing</h1>
      <BillingPanel
        org={{ id: org!.id, name: org!.name, slug }}
        subscription={subscription}
        ownerEmail={user.email!}
      />
    </div>
  )
}
