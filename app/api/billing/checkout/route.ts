import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/billing'

const schema = z.object({
  orgId: z.string().uuid(),
  orgName: z.string(),
  ownerEmail: z.string().email(),
  priceId: z.string(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { orgId, orgName, ownerEmail, priceId } = parsed.data

  // Verify requester is owner
  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .single()

  if (membership?.role !== 'owner') {
    return NextResponse.json({ error: 'Only the owner can manage billing' }, { status: 403 })
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}`
  const session = await createCheckoutSession({ orgId, orgName, ownerEmail, priceId, returnUrl })

  return NextResponse.json({ url: session.url })
}
