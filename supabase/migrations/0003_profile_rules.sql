-- LedgerCrew AI — Profile & business rules
-- Run once in Supabase -> SQL Editor, after 0001 and 0002. Safe to run again.
-- (Run migrations in order, once each: re-running 0001 afterwards would put the
--  old, looser "update own business" rule back.)

-- ---------------------------------------------------------------------
-- 1) Only a business OWNER may change business details (name, GSTIN, PAN...).
--    Same pattern as current_business_id(): a security-definer lookup, so the
--    policy doesn't recurse through profiles' own row-level security.
-- ---------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists "update own business" on public.businesses;
create policy "update own business"
on public.businesses for update
to authenticated
using (id = public.current_business_id() and public.current_user_role() = 'owner');

-- ---------------------------------------------------------------------
-- 2) Format and length rules, enforced by the database itself. The browser
--    checks the same things to give friendly messages, but only a database
--    rule can't be bypassed by calling the API directly.
-- ---------------------------------------------------------------------
alter table public.businesses drop constraint if exists businesses_name_len;
alter table public.businesses add constraint businesses_name_len
  check (char_length(btrim(name)) between 1 and 120);

alter table public.businesses drop constraint if exists businesses_business_type_len;
alter table public.businesses add constraint businesses_business_type_len
  check (business_type is null or char_length(business_type) <= 60);

alter table public.businesses drop constraint if exists businesses_address_len;
alter table public.businesses add constraint businesses_address_len
  check (address is null or char_length(address) <= 300);

alter table public.businesses drop constraint if exists businesses_registration_number_len;
alter table public.businesses add constraint businesses_registration_number_len
  check (registration_number is null or char_length(registration_number) <= 50);

-- GSTIN: 2-digit state code + 10-character PAN + entity digit + 'Z' + check character.
alter table public.businesses drop constraint if exists businesses_gstin_format;
alter table public.businesses add constraint businesses_gstin_format
  check (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$');

alter table public.businesses drop constraint if exists businesses_pan_format;
alter table public.businesses add constraint businesses_pan_format
  check (pan is null or pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$');

-- A GSTIN contains the PAN of the taxpayer (characters 3 to 12), so when both
-- are present they must agree.
alter table public.businesses drop constraint if exists businesses_gstin_pan_match;
alter table public.businesses add constraint businesses_gstin_pan_match
  check (gstin is null or pan is null or substr(gstin, 3, 10) = pan);

alter table public.profiles drop constraint if exists profiles_full_name_len;
alter table public.profiles add constraint profiles_full_name_len
  check (full_name is null or char_length(full_name) <= 100);

alter table public.profiles drop constraint if exists profiles_phone_len;
alter table public.profiles add constraint profiles_phone_len
  check (phone is null or char_length(phone) <= 25);

-- ---------------------------------------------------------------------
-- 3) Signup trigger: same behaviour as before, but it can no longer be made
--    to fail (or store junk) by an empty or oversized name in the signup data.
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
  values (left(coalesce(nullif(btrim(new.raw_user_meta_data->>'business_name'), ''), 'My Business'), 120))
  returning id into new_business_id;

  insert into public.profiles (id, business_id, full_name, email, role)
  values (
    new.id,
    new_business_id,
    left(coalesce(new.raw_user_meta_data->>'full_name', ''), 100),
    new.email,
    'owner'
  );

  return new;
end;
$$;
