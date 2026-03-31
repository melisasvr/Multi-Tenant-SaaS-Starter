import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const schema = z.object({
  name: z.string().min(2).max(64),
  slug: z.string().min(2).max(48).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
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

  const { name, slug } = parsed.data

  // Check slug availability
  const { data: existing } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
  }

  // Create org + owner membership in a transaction-like sequence
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({ name, slug })
    .select()
    .single()

  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })

  await supabaseAdmin.from('memberships').insert({
    user_id: user.id,
    org_id: org.id,
    role: 'owner',
  })

  // Create free subscription row
  await supabaseAdmin.from('subscriptions').insert({
    org_id: org.id,
    status: 'active',
    plan: 'free',
  })

  return NextResponse.json({ org }, { status: 201 })
}
