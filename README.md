# Multi-Tenant SaaS Starter

> The foundation every B2B product needs — auth, org management, team invites, and role-based access control, production-ready from day one.

**Stack:** Next.js 16 · Supabase · Stripe · TypeScript · Tailwind CSS

---

## Screenshots

### Landing Page
![Landing Page](screenshots/Screenshot%2026-03-30%190134.png)
> Marketing page with hero section, feature cards, and navigation with Sign in / Get started buttons.

### Sign Up
![Sign Up](screenshots/Screenshot%202026-03-30%190329.png)
> Clean sign up form with full name, work email, and password fields.

### Sign In
![Sign In](docs/screenshots/signin.png)
> Sign in with email/password or magic link.

### Create Workspace (Onboarding)
![Onboarding](docs/screenshots/onboarding.png)
> First-time onboarding flow — create an organization with a name and URL slug.

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
> Org dashboard showing member count, plan, and status. Sidebar with Dashboard, Members, and Billing navigation.

### Billing
![Billing](docs/screenshots/billing.png)
> Billing page with current plan indicator and upgrade options — Free ($0), Starter ($29/mo), and Pro ($99/mo).

---

## What's Included

**Authentication**
- Email/password and magic link sign-in via Supabase Auth
- OAuth providers (Google, GitHub) with one config change
- Protected routes and session management with middleware

**Organization Management**
- Create and name an org on first sign-in
- Slug-based org routing (`/[org]/dashboard`)
- Org switcher for users who belong to multiple orgs

**Team Invites**
- Invite teammates by email
- Tokenized invite links with expiry
- Accept flow works whether or not the invitee has an account

**Role-Based Access Control**
- Three built-in roles: `owner`, `admin`, `member`
- Row-level security (RLS) policies enforced at the database layer
- `useRole()` hook for conditional UI rendering

**Billing with Stripe**
- Per-org subscriptions (not per-user)
- Checkout, customer portal, and webhook handling pre-wired
- Free / Starter ($29/mo) / Pro ($99/mo) plans

---

## Project Structure

```
├── app/
│   ├── (auth)/               # Sign in, sign up, magic link, invite
│   ├── (marketing)/          # Public-facing pages
│   ├── [org]/                # Org-scoped app shell
│   │   ├── dashboard/
│   │   ├── settings/
│   │   │   ├── members/      # Invite + manage team
│   │   │   └── billing/      # Stripe customer portal
│   │   └── layout.tsx        # Org context provider
│   └── api/
│       ├── orgs/             # Org creation
│       ├── invites/          # Invite creation + acceptance
│       ├── memberships/      # Role management
│       └── webhooks/stripe/  # Stripe event handler
├── components/
│   ├── auth/                 # SignInForm, SignUpForm
│   ├── org/                  # OrgSidebar, MembersTable, InviteForm
│   └── billing/              # BillingPanel
├── lib/
│   ├── supabase/             # Server + client + admin helpers
│   ├── stripe/               # Stripe SDK + billing helpers
│   └── rbac/                 # Role checks and guards
├── supabase/
│   └── migrations/           # SQL migrations (run in order)
├── types/                    # TypeScript types
└── proxy.ts                  # Auth + org access enforcement
```

---

## Data Model

```sql
users            -- managed by Supabase Auth
organizations    -- id, name, slug, created_at
memberships      -- user_id, org_id, role, joined_at
invites          -- id, org_id, email, role, token, expires_at, accepted_at
subscriptions    -- org_id, stripe_customer_id, stripe_subscription_id, status, plan
profiles         -- id, full_name, avatar_url
```

All tables have RLS enabled. Users can only read and write data within organizations they belong to.

---

## Role Reference

| Action                  | Member | Admin | Owner |
|-------------------------|:------:|:-----:|:-----:|
| View org content        | ✓      | ✓     | ✓     |
| Invite members          |        | ✓     | ✓     |
| Change member roles     |        | ✓     | ✓     |
| Remove members          |        | ✓     | ✓     |
| Manage billing          |        |       | ✓     |
| Delete organization     |        |       | ✓     |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (optional for billing)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Push database migrations

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Stripe Setup

Add your Stripe price IDs to `.env.local`:

```env
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_yyy
```

For local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Deployment

**Vercel (recommended)**

```bash
vercel deploy
```

Add all `.env.local` variables in your Vercel project settings. Register your production webhook endpoint in the Stripe Dashboard:

```
https://your-app.vercel.app/api/webhooks/stripe
```

---

## License
