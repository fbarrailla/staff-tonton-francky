-- =============================================================================
-- Staff — Tonton Francky · Supabase schema
-- =============================================================================
-- Run this once in the Supabase SQL editor (or via the CLI) on a fresh project.
-- It creates tables, RLS policies, storage buckets, and storage policies.
-- =============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- =============================================================================
-- Tables
-- =============================================================================

-- Employees -------------------------------------------------------------------
create table if not exists public.employees (
  id           uuid primary key default gen_random_uuid(),
  full_name    text not null,
  email        text not null unique,
  phone        text,
  role         text not null default 'agent_voyage'
                check (role in (
                  'gerant','agent_voyage','developpeur','ux_designer',
                  'support_client','editeur','marketing','comptable'
                )),
  skills       text[] not null default '{}'::text[],
  avatar_url   text,
  hired_at     date   not null default current_date,
  status       text   not null default 'active' check (status in ('active','inactive')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists employees_status_idx on public.employees (status);
create index if not exists employees_role_idx   on public.employees (role);
create index if not exists employees_skills_idx on public.employees using gin (skills);

-- Days off --------------------------------------------------------------------
create table if not exists public.employee_days_off (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references public.employees(id) on delete cascade,
  start_date      date not null,
  end_date        date not null,
  number_of_days  int  not null check (number_of_days > 0),
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason          text not null,
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists days_off_employee_idx on public.employee_days_off (employee_id);
create index if not exists days_off_status_idx   on public.employee_days_off (status);
create index if not exists days_off_range_idx    on public.employee_days_off (start_date, end_date);

-- Sick leaves -----------------------------------------------------------------
create table if not exists public.employee_sick_leaves (
  id                       uuid primary key default gen_random_uuid(),
  employee_id              uuid not null references public.employees(id) on delete cascade,
  start_date               date not null,
  end_date                 date not null,
  number_of_days           int  not null check (number_of_days > 0),
  reason                   text not null,
  medical_certificate_url  text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  check (end_date >= start_date)
);

create index if not exists sick_leaves_employee_idx on public.employee_sick_leaves (employee_id);
create index if not exists sick_leaves_range_idx    on public.employee_sick_leaves (start_date, end_date);

-- Documents -------------------------------------------------------------------
-- Optional generic attachment table — referenced for medical certificates etc.
create table if not exists public.employee_documents (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references public.employees(id) on delete cascade,
  kind         text not null default 'other'
                check (kind in ('avatar','medical_certificate','other')),
  file_url     text not null,
  file_name    text not null,
  created_at   timestamptz not null default now()
);

create index if not exists documents_employee_idx on public.employee_documents (employee_id);
create index if not exists documents_kind_idx     on public.employee_documents (kind);

-- =============================================================================
-- updated_at triggers
-- =============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_employees_touch on public.employees;
create trigger trg_employees_touch
  before update on public.employees
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_days_off_touch on public.employee_days_off;
create trigger trg_days_off_touch
  before update on public.employee_days_off
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_sick_leaves_touch on public.employee_sick_leaves;
create trigger trg_sick_leaves_touch
  before update on public.employee_sick_leaves
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.employees           enable row level security;
alter table public.employee_days_off   enable row level security;
alter table public.employee_sick_leaves enable row level security;
alter table public.employee_documents  enable row level security;

-- Helper: every authenticated user (the backoffice admins) can read/write.
-- Tighten these later with role claims if you introduce non-admin users.

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'employees' and policyname = 'authenticated_all') then
    create policy authenticated_all on public.employees
      for all to authenticated
      using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'employee_days_off' and policyname = 'authenticated_all') then
    create policy authenticated_all on public.employee_days_off
      for all to authenticated
      using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'employee_sick_leaves' and policyname = 'authenticated_all') then
    create policy authenticated_all on public.employee_sick_leaves
      for all to authenticated
      using (true) with check (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'employee_documents' and policyname = 'authenticated_all') then
    create policy authenticated_all on public.employee_documents
      for all to authenticated
      using (true) with check (true);
  end if;
end$$;

-- =============================================================================
-- Storage buckets & policies
-- =============================================================================
-- NOTE — on newer Supabase projects the SQL editor role cannot write to
-- `storage.buckets` or `storage.objects` directly. If you see
-- "relation storage.buckets does not exist" or a permission error, skip this
-- section and either:
--   1) Create the buckets via the Dashboard (Storage → "New bucket"):
--        - `avatars`                 · public
--        - `medical-certificates`    · private
--      then run the storage POLICY block below from the Dashboard policy editor.
--   2) Or run `supabase/storage.sql` separately with a database role that has
--      storage admin rights (the postgres role or a migration runner).
--
-- This block is wrapped in an EXCEPTION handler so the rest of the schema
-- still applies cleanly even when storage isn't accessible from this role.
-- =============================================================================

do $storage$
begin
  -- Buckets — public avatars + private medical certificates
  insert into storage.buckets (id, name, public)
    values ('avatars', 'avatars', true)
    on conflict (id) do nothing;

  insert into storage.buckets (id, name, public)
    values ('medical-certificates', 'medical-certificates', false)
    on conflict (id) do nothing;

  -- Avatars: anyone can read; authenticated users can write/update/delete.
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_read') then
    execute $sql$ create policy avatars_read on storage.objects
      for select to public using (bucket_id = 'avatars') $sql$;
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_write') then
    execute $sql$ create policy avatars_write on storage.objects
      for insert to authenticated with check (bucket_id = 'avatars') $sql$;
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_update') then
    execute $sql$ create policy avatars_update on storage.objects
      for update to authenticated using (bucket_id = 'avatars') with check (bucket_id = 'avatars') $sql$;
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'avatars_delete') then
    execute $sql$ create policy avatars_delete on storage.objects
      for delete to authenticated using (bucket_id = 'avatars') $sql$;
  end if;

  -- Medical certificates: only authenticated users can read/write.
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'medical_read') then
    execute $sql$ create policy medical_read on storage.objects
      for select to authenticated using (bucket_id = 'medical-certificates') $sql$;
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'medical_write') then
    execute $sql$ create policy medical_write on storage.objects
      for insert to authenticated with check (bucket_id = 'medical-certificates') $sql$;
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'medical_update') then
    execute $sql$ create policy medical_update on storage.objects
      for update to authenticated using (bucket_id = 'medical-certificates') with check (bucket_id = 'medical-certificates') $sql$;
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'medical_delete') then
    execute $sql$ create policy medical_delete on storage.objects
      for delete to authenticated using (bucket_id = 'medical-certificates') $sql$;
  end if;

  raise notice 'Storage buckets + policies applied successfully.';

exception
  when undefined_table or insufficient_privilege then
    raise notice 'Skipping storage setup — current role cannot access storage.buckets / storage.objects. Create the buckets via the Dashboard (Storage → New bucket) and apply the policies from supabase/storage.sql.';
end
$storage$;

-- =============================================================================
-- Useful views
-- =============================================================================
create or replace view public.v_employee_monthly_balance as
select
  e.id as employee_id,
  e.full_name,
  date_trunc('month', d.start_date)::date as month,
  coalesce(sum(d.number_of_days) filter (where d.status in ('pending','approved')), 0)::int as used,
  4 as quota,
  greatest(0, 4 - coalesce(sum(d.number_of_days) filter (where d.status in ('pending','approved')), 0))::int as remaining
from public.employees e
left join public.employee_days_off d on d.employee_id = e.id
group by e.id, e.full_name, date_trunc('month', d.start_date);

-- =============================================================================
-- Done.
-- =============================================================================
