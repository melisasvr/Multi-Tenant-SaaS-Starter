export type Role = 'owner' | 'admin' | 'member'

export type Plan = 'free' | 'starter' | 'pro'

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Membership {
  id: string
  user_id: string
  org_id: string
  role: Role
  joined_at: string
  user?: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface Invite {
  id: string
  org_id: string
  email: string
  role: Role
  token: string
  invited_by: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface Subscription {
  id: string
  org_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'
  plan: Plan
  current_period_end: string | null
}

export interface OrgContext {
  org: Organization
  membership: Membership
  subscription: Subscription | null
}
