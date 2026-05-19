-- =============================================================================
-- One-shot role migration — THE canonical file. Re-run any time the role
-- enum changes; it always brings the DB to the latest state.
-- =============================================================================
-- Idempotent. Replaces every previous role migration:
--   migrate_roles.sql, add_leadership_roles.sql, add_graphic_designer_role.sql
--
-- Currently authoritative role set (15 values):
--   ceo, cgo, project_director, cto                            (leadership)
--   account_administrator, twitch_moderator                    (operations)
--   webmaster, graphic_designer, copywriter, video_makers      (creative / web)
--   marketing_specialist, community_manager                    (marketing)
--   agent, intern                                              (general)
-- =============================================================================

begin;

-- 1. Drop legacy constraint + default
alter table public.employees drop constraint if exists employees_role_check;
alter table public.employees alter column role drop default;

-- 2. Re-map any old or unknown value to the new set
update public.employees as e
set role = case
  -- 4 leadership rows pinned to the right new role by email
  when e.email = 'francois.barrailla@gmail.com' then 'ceo'
  when e.email = 'nanabymoon@gmail.com'         then 'cgo'
  when e.email = 'adryxjatin@gmail.com'         then 'project_director'
  when e.email = 'punitpunia005@gmail.com'      then 'cto'

  -- Gugum is the resident graphic designer
  when e.email = 'gumelargugum2810@gmail.com'   then 'graphic_designer'

  -- direct legacy → new
  when e.role = 'comptable'      then 'account_administrator'
  when e.role = 'agent_voyage'   then 'agent'
  when e.role = 'developpeur'    then 'webmaster'
  when e.role = 'support_client' then 'twitch_moderator'
  when e.role = 'ux_designer'    then 'graphic_designer'

  -- gerant fallback (the 4 leaders above are already pinned)
  when e.role = 'gerant'         then 'project_director'

  -- editeur: video maker vs copywriter (look at the first skill chip)
  when e.role = 'editeur' and exists (
    select 1 from unnest(e.skills) s where lower(s) like '%video%'
  ) then 'video_makers'
  when e.role = 'editeur'        then 'copywriter'

  -- marketing: community manager vs marketing specialist
  when e.role = 'marketing' and exists (
    select 1 from unnest(e.skills) s where lower(s) like '%community%'
  ) then 'community_manager'
  when e.role = 'marketing'      then 'marketing_specialist'

  -- already on the new set — leave as-is
  when e.role in (
    'ceo','cgo','project_director','cto',
    'account_administrator','twitch_moderator','webmaster','graphic_designer',
    'copywriter','video_makers','marketing_specialist','community_manager',
    'agent','intern'
  ) then e.role

  -- safety net
  else 'agent'
end;

-- 3. Re-create the constraint with the full new set
alter table public.employees
  add constraint employees_role_check
  check (role in (
    'ceo','cgo','project_director','cto',
    'account_administrator','twitch_moderator','webmaster','graphic_designer',
    'copywriter','video_makers','marketing_specialist','community_manager',
    'agent','intern'
  ));

-- 4. Default role for new employees
alter table public.employees alter column role set default 'agent';

commit;

-- Verify — every employee + their final role, leadership first
select full_name, email, role
from public.employees
order by
  case role
    when 'ceo' then 1 when 'cgo' then 2 when 'project_director' then 3
    when 'cto' then 4 else 99
  end,
  full_name;
