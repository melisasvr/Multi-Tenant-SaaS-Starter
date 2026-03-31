'use client'

import { useState } from 'react'
import { PLANS, FREE_PLAN_LIMITS } from '@/lib/stripe'
import type { Subscription } from '@/types'

interface Props {
  org: { id: string; name: string; slug: string }
  subscription: Subscription | null
  ownerEmail: string
}

export function BillingPanel({ org, subscription, ownerEmail }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  const currentPlan = subscription?.plan ?? 'free'
  const status = subscription?.status ?? 'active'

  async function handleCheckout(priceId: string, planKey: string) {
    setLoading(planKey)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId: org.id, orgName: org.name, ownerEmail, priceId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(null)
  }

  async function handlePortal() {
    setLoading('portal')
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId: org.id, returnUrl: window.location.href }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(null)
  }

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current plan</div>
            <div className="text-xl font-bold text-gray-900 capitalize">{currentPlan}</div>
            {subscription?.current_period_end && (
              <div className="text-xs text-gray-400 mt-0.5">
                Renews {new Date(subscription.current_period_end).toLocaleDateString()}
              </div>
            )}
          </div>
          <span className={`badge ${
            status === 'active' || status === 'trialing'
              ? 'bg-green-100 text-green-800'
              : status === 'past_due'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {status}
          </span>
        </div>

        {currentPlan !== 'free' && (
          <button
            onClick={handlePortal}
            disabled={loading === 'portal'}
            className="btn-secondary mt-4 text-xs"
          >
            {loading === 'portal' ? 'Loading…' : 'Manage subscription →'}
          </button>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Free */}
        <div className={`card p-5 ${currentPlan === 'free' ? 'ring-2 ring-brand-500' : ''}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-semibold text-gray-900">Free</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">$0</div>
            </div>
            {currentPlan === 'free' && (
              <span className="badge bg-brand-100 text-brand-700">Current</span>
            )}
          </div>
          <ul className="text-sm text-gray-500 space-y-1 mb-4">
            <li>Up to {FREE_PLAN_LIMITS.members} members</li>
            <li>Core features</li>
          </ul>
        </div>

        {/* Paid plans */}
        {Object.entries(PLANS).map(([key, plan]) => {
          const isCurrent = currentPlan === key
          return (
            <div key={key} className={`card p-5 ${isCurrent ? 'ring-2 ring-brand-500' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-gray-900">{plan.name}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    ${(plan.price / 100).toFixed(0)}
                    <span className="text-sm font-normal text-gray-400">/mo</span>
                  </div>
                </div>
                {isCurrent && (
                  <span className="badge bg-brand-100 text-brand-700">Current</span>
                )}
              </div>
              <ul className="text-sm text-gray-500 space-y-1 mb-4">
                {plan.features.map((f) => <li key={f}>{f}</li>)}
              </ul>
              {!isCurrent && (
                <button
                  onClick={() => handleCheckout(plan.priceId, key)}
                  disabled={!!loading}
                  className="btn-primary w-full justify-center text-sm"
                >
                  {loading === key ? 'Redirecting…' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
