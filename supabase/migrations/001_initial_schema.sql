-- Migration: 001_initial_schema
-- Run via: supabase db push

-- ─────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- Organizations
-- ─────────────────────────────────────────
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ─────────────────────────────────────────
-- Memberships
-- ─────────────────────────────────────────
create type public.member_role as enum ('owner', 'admin', 'member');

create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  role        public.member_role not null default 'member',
  joined_at   timestamptz not null default now(),
  unique(user_id, org_id)
);

alter table public.memberships enable row level security;

-- ─────────────────────────────────────────
-- Invites
-- ─────────────────────────────────────────
create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text not null,
  role        public.member_role not null default 'member',
  token       text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  invited_by  uuid not null references auth.users(id) on delete cascade,
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.invites enable row level security;

-- ─────────────────────────────────────────
-- Subscriptions
-- ─────────────────────────────────────────
create type public.subscription_status as enum (
  'active', 'trialing', 'past_due', 'canceled', 'incomplete'
);

create type public.plan_name as enum ('free', 'starter', 'pro');

create table public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  org_id                   uuid not null unique references public.organizations(id) on delete cascade,
  stripe_customer_id       text unique,
  stripe_subscription_id   text unique,
  status                   public.subscription_status not null default 'active',
  plan                     public.plan_name not null default 'free',
  current_period_end       timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- ─────────────────────────────────────────
-- User profiles (extends auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ─────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────

-- Helper: is user a member of org?
create or replace function public.is_member_of(org_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.memberships
    where memberships.org_id = $1
    and memberships.user_id = auth.uid()
  );
$$;

-- Helper: get user's role in org
create or replace function public.role_in_org(org_id uuid)
returns text language sql security definer as $$
  select role::text from public.memberships
  where memberships.org_id = $1
  and memberships.user_id = auth.uid()
  limit 1;
$$;

-- Organizations
create policy "Members can view their orgs"
  on public.organizations for select
  using (public.is_member_of(id));

create policy "Owners can update their org"
  on public.organizations for update
  using (public.role_in_org(id) = 'owner');

-- Memberships
create policy "Members can view org memberships"
  on public.memberships for select
  using (public.is_member_of(org_id));

create policy "Admins and owners can insert memberships"
  on public.memberships for insert
  with check (public.role_in_org(org_id) in ('admin', 'owner'));

create policy "Admins and owners can update memberships"
  on public.memberships for update
  using (public.role_in_org(org_id) in ('admin', 'owner'));

create policy "Admins and owners can delete memberships"
  on public.memberships for delete
  using (public.role_in_org(org_id) in ('admin', 'owner'));

-- Invites
create policy "Members can view org invites"
  on public.invites for select
  using (public.is_member_of(org_id));

create policy "Admins and owners can create invites"
  on public.invites for insert
  with check (public.role_in_org(org_id) in ('admin', 'owner'));

create policy "Admins and owners can delete invites"
  on public.invites for delete
  using (public.role_in_org(org_id) in ('admin', 'owner'));

-- Subscriptions
create policy "Members can view their org subscription"
  on public.subscriptions for select
  using (public.is_member_of(org_id));

-- Profiles
create policy "Users can view any profile"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- ─────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────

-- Auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update subscriptions.updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();
