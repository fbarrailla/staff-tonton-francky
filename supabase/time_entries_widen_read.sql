-- =============================================================================
-- Team-wide read access + author_email column for time_entries
-- =============================================================================
-- Two changes so a manager view can join time entries back to employees:
--   1. Widen SELECT to all authenticated users (writes stay scoped to owner)
--   2. Add an `author_email` column auto-filled by trigger from auth.users
--      so the client can match an entry back to its public.employees row
--      (we match by email).
--
-- Idempotent — safe to re-run.
-- =============================================================================

-- 1. Add author_email column ---------------------------------------------------
alter table public.time_entries
  add column if not exists author_email text;

create index if not exists time_entries_author_email_idx
  on public.time_entries (author_email);

-- 2. Trigger that copies the email from auth.users on insert -------------------
create or replace function public.time_entries_set_author_email()
returns trigger language plpgsql security definer as $$
begin
  if new.author_email is null and new.user_id is not null then
    select u.email into new.author_email from auth.users u where u.id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_time_entries_email on public.time_entries;
create trigger trg_time_entries_email
  before insert on public.time_entries
  for each row execute function public.time_entries_set_author_email();

-- 3. Backfill any existing rows ------------------------------------------------
update public.time_entries te
   set author_email = u.email
  from auth.users u
 where te.user_id = u.id
   and te.author_email is null;

-- 4. Widen SELECT policy -------------------------------------------------------
drop policy if exists own_select on public.time_entries;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'time_entries' and policyname = 'team_select'
  ) then
    create policy team_select on public.time_entries
      for select to authenticated using (true);
  end if;
end$$;
