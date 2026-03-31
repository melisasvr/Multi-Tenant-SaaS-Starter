import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe/billing'

const schema = z.object({
  orgId: z.string().uuid(),
  returnUrl: z.string().url(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { orgId, returnUrl } = parsed.data

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single()

  if (membership?.role !== 'owner') {
    return NextResponse.json({ error: 'Only the owner can manage billing' }, { status: 403 })
  }

  const session = await createPortalSession(orgId, returnUrl)
  return NextResponse.json({ url: session.url })
}
