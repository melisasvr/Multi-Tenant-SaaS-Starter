import Stripe from 'stripe'
import type { Plan } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export interface PlanConfig {
  name: string
  description: string
  priceId: string
  price: number // monthly USD cents
  limits: {
    members: number
  }
  features: string[]
}

export const PLANS: Record<Exclude<Plan, 'free'>, PlanConfig> = {
  starter: {
    name: 'Starter',
    description: 'For small teams getting started',
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? 'price_starter',
    price: 2900,
    limits: { members: 5 },
    features: [
      'Up to 5 team members',
      'Core features',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    description: 'For growing teams that need more',
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? 'price_pro',
    price: 9900,
    limits: { members: 50 },
    features: [
      'Up to 50 team members',
      'All features',
      'Priority support',
      'SSO (coming soon)',
    ],
  },
}

export const FREE_PLAN_LIMITS = { members: 3 }
