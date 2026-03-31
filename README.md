# Multi-Tenant SaaS Starter

> The foundation every B2B product needs auth, org management, team invites, and role-based access control, production-ready from day one.

### Stack: Next.js 16 · Supabase · Stripe ·  TypeScript · Tailwind CSS
-----
## Screenshots:
### Landing Page

![Landing Page](screenshots/Screenshot%202026-03-30%20190134.png) 

- Marketing page with hero section, feature cards, and navigation with Sign in / Get started buttons.

### Sign Up
![Sign Up](screenshots/Screenshot%202026-03-30%20190329.png)

- Clean sign up form with full name, work email, and password fields.

### Sign In
![Sign In](screenshots/Screenshot%202026-03-30%20190312.png)

- Sign in with email/password or magic link.

### Create Workspace (Onboarding)

![Onboarding](screenshots/Screenshot%202026-03-30%20193332.png)

- First-time onboarding flow create an organization with a name and URL slug.

### Dashboard

![Dashboard](screenshots/Screenshot%202026-03-30%20193516.png)

> Org dashboard showing member count, plan, and status. Sidebar with Dashboard, Members, and Billing navigation.

### Billing

![Billing](screenshots/Screenshot%202026-03-30%20193639.png)

> Billing page with current plan indicator and upgrade options. Free ($0), Starter ($29/mo), and Pro ($99/mo).
-----

## What's Included


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
- Three built-in roles: `owner`, `admin`, `member.`
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

## License - MIT License
```
Copyright (c) 2026 Socratic Math Tutor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including, without limitation, the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
