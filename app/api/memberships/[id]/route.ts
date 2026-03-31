import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { canManageMembers, canChangeRole } from '@/lib/rbac'
import type { Role } from '@/types'

interface Params { params: Promise<{ id: string }> }

const patchSchema = z.object({ role: z.enum(['admin', 'member']) })

async function getActorAndTarget(membershipId: string, userId: string) {
  const { data: target } = await supabaseAdmin
    .from('memberships')
    .select('id, user_id, org_id, role')
    .eq('id', membershipId)
    .single()
  if (!target) return null

  const { data: actor } = await supabaseAdmin
    .from('memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', target.org_id)
    .single()
  if (!actor) return null

  return { target, actorRole: actor.role as Role }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const ctx = await getActorAndTarget(id, user.id)
  if (!ctx) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { target, actorRole } = ctx
  if (!canChangeRole(actorRole, target.role as Role, parsed.data.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabaseAdmin.from('memberships').update({ role: parsed.data.role }).eq('id', id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await getActorAndTarget(id, user.id)
  if (!ctx) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { target, actorRole } = ctx
  if (target.user_id === user.id) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
  }
  if (!canManageMembers(actorRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabaseAdmin.from('memberships').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
