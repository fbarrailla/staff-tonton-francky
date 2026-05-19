-- =============================================================================
-- One-shot role migration — RUN THIS ONE FILE
-- =============================================================================
-- Single, idempotent script that:
--   1. Drops the legacy role constraint + default
--   2. Re-maps every existing row from the old enum to the new one
--      (with smart disambiguation based on the first skill chip)
--   3. Adds the new check constraint with the full 13-value list
--      (4 leadership roles at the top + the 9 working roles)
--   4. Assigns the four leadership roles by email
--   5. Sets the default role to 'agent'
--
-- Safe to re-run. Replaces both supabase/migrate_roles.sql AND
-- supabase/add_leadership_roles.sql.
-- =============================================================================

begin;

-- 1. Drop legacy constraint + default
alter table public.employees drop constraint if exists employees_role_check;
alter table public.employees alter column role drop default;

-- 2. Re-map any old/unknown value to the new set
update public.employees as e
set role = case
  -- 4 specific leadership rows: pin to the right new role by email
  when e.email = 'francois.barrailla@gmail.com' then 'ceo'
  when e.email = 'nanabymoon@gmail.com'         then 'cgo'
  when e.email = 'adryxjatin@gmail.com'         then 'project_director'
  when e.email = 'punitpunia005@gmail.com'      then 'cto'

  -- direct old → new
  when e.role = 'comptable'      then 'account_administrator'
  when e.role = 'agent_voyage'   then 'agent'
  when e.role = 'developpeur'    then 'webmaster'

  -- support_client was used for moderator-y jobs
  when e.role = 'support_client' then 'twitch_moderator'

  -- ux_designer has no perfect match — closest is webmaster
  when e.role = 'ux_designer'    then 'webmaster'

  -- gerant: any remaining leadership row goes to project_director as
  -- the closest leadership bucket (the four mapped above are already
  -- handled by the email rules)
  when e.role = 'gerant'         then 'project_director'

  -- editeur: video makers vs copywriters (split by skill chip)
  when e.role = 'editeur' and exists (
    select 1 from unnest(e.skills) s where lower(s) like '%video%'
  ) then 'video_makers'
  when e.role = 'editeur'        then 'copywriter'

  -- marketing: community managers vs marketing specialists
  when e.role = 'marketing' and exists (
    select 1 from unnest(e.skills) s where lower(s) like '%community%'
  ) then 'community_manager'
  when e.role = 'marketing'      then 'marketing_specialist'

  -- already on the new set — leave as-is
  when e.role in (
    'ceo','cgo','project_director','cto',
    'account_administrator','twitch_moderator','webmaster','copywriter',
    'video_makers','marketing_specialist','community_manager','agent','intern'
  ) then e.role

  -- safety net for any other unexpected value
  else 'agent'
end;

-- 3. Re-create the constraint with the full new set
alter table public.employees
  add constraint employees_role_check
  check (role in (
    'ceo','cgo','project_director','cto',
    'account_administrator','twitch_moderator','webmaster','copywriter',
    'video_makers','marketing_specialist','community_manager','agent','intern'
  ));

-- 4. Set the new default
alter table public.employees alter column role set default 'agent';

commit;

-- Verify — every employee + their final role
select
  full_name,
  email,
  role
from public.employees
order by
  case role
    when 'ceo' then 1 when 'cgo' then 2 when 'project_director' then 3
    when 'cto' then 4 else 99
  end,
  full_name;
