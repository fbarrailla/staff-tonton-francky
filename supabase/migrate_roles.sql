-- =============================================================================
-- Migrate employees.role to the new enum set
-- =============================================================================
-- New roles:
--   account_administrator · twitch_moderator · webmaster · copywriter ·
--   video_makers · marketing_specialist · community_manager · agent · intern
--
-- The migration runs in three atomic steps inside one transaction so the
-- table is never in an in-between state visible to the app:
--   1. Drop the old CHECK constraint
--   2. Re-map every existing value using best-effort rules (looks at first
--      skill chip to disambiguate generic old roles like 'marketing' or
--      'editeur')
--   3. Add the new CHECK constraint and reset the default
--
-- Idempotent: safe to re-run — it skips work whose effect is already in place.
-- =============================================================================

begin;

-- 1. Drop the old check constraint (and the default that references the old enum)
alter table public.employees
  drop constraint if exists employees_role_check;

alter table public.employees
  alter column role drop default;

-- 2. Re-map values. Generic old roles are disambiguated by inspecting the
--    first skill chip we stored (it preserves the human title).
update public.employees as e
set role = case
  -- direct old → new
  when e.role = 'comptable'      then 'account_administrator'
  when e.role = 'agent_voyage'   then 'agent'
  when e.role = 'developpeur'    then 'webmaster'

  -- support_client was used for moderator-y jobs
  when e.role = 'support_client' then 'twitch_moderator'

  -- ux_designer has no perfect match — closest is webmaster
  when e.role = 'ux_designer'    then 'webmaster'

  -- gerant (CEO/CGO/Director) — no leadership role in the new set;
  -- fall back to 'agent' so they can be re-classified manually
  when e.role = 'gerant'         then 'agent'

  -- editeur: split by first skill (Video maker → video_makers, else copywriter)
  when e.role = 'editeur' and exists (
    select 1 from unnest(e.skills) s where lower(s) like '%video%'
  ) then 'video_makers'
  when e.role = 'editeur'        then 'copywriter'

  -- marketing: Community manager vs Marketing specialist
  when e.role = 'marketing' and exists (
    select 1 from unnest(e.skills) s where lower(s) like '%community%'
  ) then 'community_manager'
  when e.role = 'marketing'      then 'marketing_specialist'

  -- already on the new set — leave as-is
  when e.role in (
    'account_administrator','twitch_moderator','webmaster','copywriter',
    'video_makers','marketing_specialist','community_manager','agent','intern'
  ) then e.role

  -- any other unexpected value defaults to agent
  else 'agent'
end
where true;

-- 3. New constraint + default
alter table public.employees
  add constraint employees_role_check
  check (role in (
    'account_administrator','twitch_moderator','webmaster','copywriter',
    'video_makers','marketing_specialist','community_manager','agent','intern'
  ));

alter table public.employees
  alter column role set default 'agent';

commit;

-- Verify
select role, count(*)
from public.employees
group by role
order by count(*) desc;
