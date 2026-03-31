import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'

export const metadata = { title: 'Accept Invite' }

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function InvitePage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect('/sign-in')

  // Look up invite
  const { data: invite } = await supabaseAdmin
    .from('invites')
    .select('*, organizations(name, slug)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid invite</h1>
        <p className="text-sm text-gray-500 mb-4">
          This invite link has expired or already been used.
        </p>
        <Link href="/" className="btn-primary">Go home</Link>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const org = invite.organizations as { name: string; slug: string }

  // User is signed in — accept invite immediately
  if (user) {
    if (user.email === invite.email) {
      await supabaseAdmin.from('memberships').upsert({
        user_id: user.id,
        org_id: invite.org_id,
        role: invite.role,
      })
      await supabaseAdmin
        .from('invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)

      redirect(`/${org.slug}/dashboard`)
    }

    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Wrong account</h1>
        <p className="text-sm text-gray-500">
          This invite was sent to <strong>{invite.email}</strong> but you&apos;re signed in as{' '}
          <strong>{user.email}</strong>. Please sign out and sign in with the correct account.
        </p>
      </div>
    )
  }

  // Not signed in — show invite card and prompt sign up / sign in
  return (
    <div className="card p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        You&apos;re invited!
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Join <strong>{org.name}</strong> as a <strong>{invite.role}</strong>.
        <br />Invite sent to <strong>{invite.email}</strong>.
      </p>
      <div className="flex flex-col gap-3">
        <Link
          href={`/sign-up?email=${encodeURIComponent(invite.email)}&token=${token}`}
          className="btn-primary w-full justify-center"
        >
          Create account &amp; join
        </Link>
        <Link
          href={`/sign-in?email=${encodeURIComponent(invite.email)}&token=${token}`}
          className="btn-secondary w-full justify-center"
        >
          Sign in &amp; join
        </Link>
      </div>
    </div>
  )
}
