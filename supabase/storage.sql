-- =============================================================================
-- Storage policies — Staff Tonton Francky
-- =============================================================================
-- Run this AFTER creating the two buckets via the Dashboard:
--   1. Storage → "New bucket" → name: `avatars`              · Public  ✔
--   2. Storage → "New bucket" → name: `medical-certificates` · Public ✘ (private)
--
-- Then paste this whole file into the SQL editor and run.
-- =============================================================================

do $$
begin
  -- Avatars — public read, authenticated write
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

  -- Medical certificates — private, authenticated only
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
end$$;
