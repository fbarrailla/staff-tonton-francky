-- =============================================================================
-- Applicants — Staff Tonton Francky
-- =============================================================================
-- Adds the `applicants` table (CV / motivation letter / portfolio tracking)
-- to an already-provisioned project. Run after `supabase/schema.sql`.
--
-- Storage bucket: create a private bucket named `applicants` via the
-- Dashboard (Storage → New bucket → Public ✘), then run `supabase/storage.sql`
-- to attach policies (the bucket falls under the same "authenticated only"
-- treatment as `medical-certificates`).
-- =============================================================================

create table if not exists public.applicants (
  id                       uuid primary key default gen_random_uuid(),
  full_name                text not null,
  email                    text not null,
  phone                    text,
  skills                   text[] not null default '{}'::text[],
  applied_position         text,
  status                   text not null default 'nouveau'
                            check (status in ('nouveau','en_revue','entretien','embauche','refuse')),
  cv_url                   text,
  motivation_letter_url    text,
  portfolio_url            text,
  admin_note               text,
  applied_at               date not null default current_date,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists applicants_status_idx   on public.applicants (status);
create index if not exists applicants_email_idx    on public.applicants (lower(email));
create index if not exists applicants_skills_idx   on public.applicants using gin (skills);
create index if not exists applicants_applied_idx  on public.applicants (applied_at desc);

drop trigger if exists trg_applicants_touch on public.applicants;
create trigger trg_applicants_touch
  before update on public.applicants
  for each row execute function public.touch_updated_at();

alter table public.applicants enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'applicants' and policyname = 'authenticated_all') then
    create policy authenticated_all on public.applicants
      for all to authenticated
      using (true) with check (true);
  end if;
end$$;

-- =============================================================================
-- Storage policies for the `applicants` bucket
-- Run after creating the bucket via the Dashboard (private).
-- Wrapped in an exception handler so this script doesn't fail when the SQL
-- editor role can't reach storage.objects.
-- =============================================================================
do $applicants_storage$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'applicants_read') then
    execute $sql$ create policy applicants_read on storage.objects
      for select to authenticated using (bucket_id = 'applicants') $sql$;
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'applicants_write') then
    execute $sql$ create policy applicants_write on storage.objects
      for insert to authenticated with check (bucket_id = 'applicants') $sql$;
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'applicants_update') then
    execute $sql$ create policy applicants_update on storage.objects
      for update to authenticated using (bucket_id = 'applicants') with check (bucket_id = 'applicants') $sql$;
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'applicants_delete') then
    execute $sql$ create policy applicants_delete on storage.objects
      for delete to authenticated using (bucket_id = 'applicants') $sql$;
  end if;

  raise notice 'applicants storage policies applied.';

exception
  when undefined_table or insufficient_privilege then
    raise notice 'Skipping applicants storage policies — create the bucket and policies via the Dashboard.';
end
$applicants_storage$;
