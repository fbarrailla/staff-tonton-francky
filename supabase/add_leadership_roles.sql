-- =============================================================================
-- Add CEO / CGO / Project director / CTO to employees.role + assign them
-- =============================================================================
-- Extends the role enum with 4 leadership values and updates the four
-- existing rows that should carry them. Single transaction so the DB is
-- never in an in-between state.
--
-- Idempotent — safe to re-run.
-- =============================================================================

begin;

-- 1. Replace the check constraint with the wider list
alter table public.employees
  drop constraint if exists employees_role_check;

alter table public.employees
  add constraint employees_role_check
  check (role in (
    'ceo','cgo','project_director','cto',
    'account_administrator','twitch_moderator','webmaster','copywriter',
    'video_makers','marketing_specialist','community_manager','agent','intern'
  ));

-- 2. Assign the four leadership roles
update public.employees set role = 'ceo'              where email = 'francois.barrailla@gmail.com';
update public.employees set role = 'cgo'              where email = 'nanabymoon@gmail.com';
update public.employees set role = 'project_director' where email = 'adryxjatin@gmail.com';
update public.employees set role = 'cto'              where email = 'punitpunia005@gmail.com';

commit;

-- Verify
select email, full_name, role
from public.employees
where email in (
  'francois.barrailla@gmail.com','nanabymoon@gmail.com',
  'adryxjatin@gmail.com','punitpunia005@gmail.com'
)
order by case role
  when 'ceo' then 1 when 'cgo' then 2 when 'project_director' then 3
  when 'cto' then 4 else 99 end;
