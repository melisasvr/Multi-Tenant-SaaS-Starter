import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.org_id
        if (!orgId || !session.subscription) break

        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = sub.items.data[0]?.price.id

        await supabaseAdmin.from('subscriptions').upsert({
          org_id: orgId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: sub.id,
          status: sub.status,
          plan: priceIdToPlan(priceId),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }, { onConflict: 'org_id' })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const orgId = sub.metadata?.org_id
        if (!orgId) break

        const priceId = sub.items.data[0]?.price.id
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: sub.status,
            plan: priceIdToPlan(priceId),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled', plan: 'free', stripe_subscription_id: null })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string)
        }
        break
      }

      default:
        console.log(`Unhandled event: ${event.type}`)
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

function priceIdToPlan(priceId: string): 'free' | 'starter' | 'pro' {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'starter'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  return 'free'
}
