-- =============================================================================
-- Time entries — Staff Tonton Francky
-- =============================================================================
-- Each authenticated user logs their own time. RLS scopes reads + writes to
-- the row's user_id matching auth.uid(). Run after supabase/schema.sql.
-- =============================================================================

create table if not exists public.time_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  work_date    date not null,
  hours        numeric(4,2) not null check (hours > 0 and hours <= 24),
  description  text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists time_entries_user_date_idx
  on public.time_entries (user_id, work_date desc);

drop trigger if exists trg_time_entries_touch on public.time_entries;
create trigger trg_time_entries_touch
  before update on public.time_entries
  for each row execute function public.touch_updated_at();

-- Auto-fill user_id with the caller's auth.uid() on insert when missing.
create or replace function public.time_entries_set_user_id()
returns trigger language plpgsql as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_time_entries_user on public.time_entries;
create trigger trg_time_entries_user
  before insert on public.time_entries
  for each row execute function public.time_entries_set_user_id();

-- RLS — every user manages their own entries only.
alter table public.time_entries enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'time_entries' and policyname = 'own_select') then
    create policy own_select on public.time_entries
      for select to authenticated using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'time_entries' and policyname = 'own_insert') then
    create policy own_insert on public.time_entries
      for insert to authenticated with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'time_entries' and policyname = 'own_update') then
    create policy own_update on public.time_entries
      for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'time_entries' and policyname = 'own_delete') then
    create policy own_delete on public.time_entries
      for delete to authenticated using (auth.uid() = user_id);
  end if;
end$$;
