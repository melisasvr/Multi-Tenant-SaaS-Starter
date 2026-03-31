import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: memberships } = await supabase
      .from('memberships')
      .select('organizations(slug)')
      .eq('user_id', user.id)
      .order('joined_at')
      .limit(1)

    const slug = (memberships?.[0]?.organizations as any)?.slug
    if (slug) redirect(`/${slug}/dashboard`)
    redirect('/onboarding')
  }

  return <MarketingPage />
}

function MarketingPage() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-semibold text-lg tracking-tight">SaaS Starter</span>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="btn-secondary">Sign in</Link>
          <Link href="/sign-up" className="btn-primary">Get started</Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-6 py-32 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          The B2B foundation,<br />
          <span className="text-brand-600">already built.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
          Auth, org management, team invites, role-based access, and Stripe billing —
          production-ready so you can ship what actually matters.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/sign-up" className="btn-primary text-base px-6 py-3">
            Start building →
          </Link>
          <a
            href="https://github.com/your-org/saas-starter"
            className="btn-secondary text-base px-6 py-3"
            target="_blank" rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Auth & Profiles', desc: 'Email, magic link, and OAuth sign-in via Supabase. Session management handled in middleware.' },
          { title: 'Multi-Tenant Orgs', desc: 'Org creation, slug-based routing, switcher for users in multiple orgs.' },
          { title: 'Team Invites', desc: 'Tokenized invite links, role assignment, works for new and existing accounts.' },
          { title: 'Role-Based Access', desc: 'Owner, admin, member roles enforced with Supabase RLS at the database layer.' },
          { title: 'Stripe Billing', desc: 'Per-org subscriptions, checkout, customer portal, webhook handling.' },
          { title: 'Type-Safe', desc: 'End-to-end TypeScript with generated Supabase types and Zod validation.' },
        ].map((f) => (
          <div key={f.title} className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
