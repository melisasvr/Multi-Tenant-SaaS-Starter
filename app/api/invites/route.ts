import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { canManageMembers } from '@/lib/rbac'
import type { Role } from '@/types'

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']),
  orgId: z.string().uuid(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { email, role, orgId } = parsed.data

  // Check actor's role
  const { data: actorMembership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single()

  if (!actorMembership || !canManageMembers(actorMembership.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if already a member
  const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
  const targetUser = existingUser?.users.find((u) => u.email === email)

  if (targetUser) {
    const { data: existingMember } = await supabaseAdmin
      .from('memberships')
      .select('id')
      .eq('user_id', targetUser.id)
      .eq('org_id', orgId)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 })
    }
  }

  // Upsert invite (revoke any existing pending invite for this email)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await supabaseAdmin
    .from('invites')
    .delete()
    .eq('org_id', orgId)
    .eq('email', email)
    .is('accepted_at', null)

  const { data: invite, error } = await supabaseAdmin
    .from('invites')
    .insert({ org_id: orgId, email, role, invited_by: user.id, expires_at: expiresAt })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${invite.token}`

  // TODO: Send invite email via Resend / SendGrid
  console.log(`Invite URL for ${email}: ${inviteUrl}`)

  return NextResponse.json({ invite, inviteUrl }, { status: 201 })
}
