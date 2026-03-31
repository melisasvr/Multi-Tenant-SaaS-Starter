import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { canManageMembers } from '@/lib/rbac'
import type { Role } from '@/types'

interface Params { params: Promise<{ id: string }> }

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: invite } = await supabaseAdmin
    .from('invites')
    .select('org_id')
    .eq('id', id)
    .single()

  if (!invite) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', invite.org_id)
    .single()

  if (!membership || !canManageMembers(membership.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabaseAdmin.from('invites').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
