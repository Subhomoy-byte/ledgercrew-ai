-- LedgerCrew AI — Core schema, part 1: businesses + profiles
-- Run this once in your Supabase project's SQL Editor (or via the CLI).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gstin text,
  pan text,
  business_type text,
  address text,
  registration_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_business_id_idx on public.profiles(business_id);

-- ---------------------------------------------------------------------
-- updated_at helper (reused by every table going forward)
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Auto-create a business + profile whenever someone signs up
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_business_id uuid;
begin
  insert into public.businesses (name)
  values (coalesce(new.raw_user_meta_data->>'business_name', 'My Business'))
  returning id into new_business_id;

  insert into public.profiles (id, business_id, full_name, email, role)
  values (
    new.id,
    new_business_id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'owner'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- RLS helper: looks up the caller's business_id WITHOUT going back through
-- profiles' own RLS policy. Referencing public.profiles directly inside a
-- policy ON public.profiles causes "infinite recursion detected in policy"
-- — this security-definer function is the standard fix, and every table's
-- policies (this one and every one added later) should use it, not a raw
-- subquery on profiles.
-- ---------------------------------------------------------------------

create or replace function public.current_business_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select business_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "select own business" on public.businesses;
create policy "select own business"
on public.businesses for select
to authenticated
using (id = public.current_business_id());

drop policy if exists "update own business" on public.businesses;
create policy "update own business"
on public.businesses for update
to authenticated
using (id = public.current_business_id());

drop policy if exists "select profiles in own business" on public.profiles;
create policy "select profiles in own business"
on public.profiles for select
to authenticated
using (business_id = public.current_business_id());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid());

-- ---------------------------------------------------------------------
-- Column-level privileges (defense in depth on top of RLS)
--
-- RLS decides WHICH ROWS a user may touch; it does not stop them changing
-- sensitive COLUMNS on a row they're allowed to touch (e.g. a member setting
-- their own role = 'owner'). So: strip every default privilege, then grant
-- back only what the app genuinely needs.
--
--   * anon (not logged in): no access at all.
--   * authenticated: read rows their RLS policy allows, and update ONLY the
--     descriptive columns below. They can never change id, business_id,
--     role, email or timestamps, and can't insert or delete directly —
--     signup is handled by the handle_new_user() trigger, and account
--     deletion will go through a server-side route using the service role.
-- ---------------------------------------------------------------------

revoke all on public.businesses from anon, authenticated;
revoke all on public.profiles from anon, authenticated;

grant select on public.businesses to authenticated;
grant select on public.profiles to authenticated;

grant update (name, gstin, pan, business_type, address, registration_number)
  on public.businesses to authenticated;
grant update (full_name, phone, avatar_url)
  on public.profiles to authenticated;
