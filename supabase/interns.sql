-- =============================================================================
-- Interns — Staff Tonton Francky
-- =============================================================================
-- Adds the `interns` table. Run after `supabase/schema.sql`.
-- =============================================================================

create table if not exists public.interns (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  email         text not null,
  phone         text,
  age           int,
  applied_at    date,
  interview_at  text,   -- free-form text (input formats vary widely)
  status        text not null default 'pending'
                  check (status in ('pending','active','hired','ended')),
  skills        text[] not null default '{}'::text[],
  admin_note    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists interns_email_uidx on public.interns (lower(email));
create index if not exists interns_status_idx       on public.interns (status);
create index if not exists interns_applied_idx      on public.interns (applied_at desc);
create index if not exists interns_skills_idx       on public.interns using gin (skills);

drop trigger if exists trg_interns_touch on public.interns;
create trigger trg_interns_touch
  before update on public.interns
  for each row execute function public.touch_updated_at();

alter table public.interns enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'interns' and policyname = 'authenticated_all') then
    create policy authenticated_all on public.interns
      for all to authenticated
      using (true) with check (true);
  end if;
end$$;
