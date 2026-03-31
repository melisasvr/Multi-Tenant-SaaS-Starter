import { stripe } from './index'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getOrCreateStripeCustomer(orgId: string, orgName: string, email: string) {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('org_id', orgId)
    .single()

  if (sub?.stripe_customer_id) return sub.stripe_customer_id

  const customer = await stripe.customers.create({
    name: orgName,
    email,
    metadata: { org_id: orgId },
  })

  await supabaseAdmin.from('subscriptions').upsert({
    org_id: orgId,
    stripe_customer_id: customer.id,
    status: 'active',
    plan: 'free',
  })

  return customer.id
}

export async function createCheckoutSession({
  orgId,
  orgName,
  ownerEmail,
  priceId,
  returnUrl,
}: {
  orgId: string
  orgName: string
  ownerEmail: string
  priceId: string
  returnUrl: string
}) {
  const customerId = await getOrCreateStripeCustomer(orgId, orgName, ownerEmail)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?upgrade=success`,
    cancel_url: `${returnUrl}?upgrade=canceled`,
    metadata: { org_id: orgId },
    subscription_data: { metadata: { org_id: orgId } },
  })

  return session
}

export async function createPortalSession(orgId: string, returnUrl: string) {
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('org_id', orgId)
    .single()

  if (!sub?.stripe_customer_id) throw new Error('No Stripe customer found')

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: returnUrl,
  })

  return session
}
