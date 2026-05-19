-- =============================================================================
-- Add the "graphic_designer" role to the enum
-- =============================================================================
-- Extends the employees.role check constraint with one new value
-- (`graphic_designer`) and reassigns the existing graphic designer
-- (Gugum, by email) from `webmaster` back to the right bucket.
-- Idempotent.
-- =============================================================================

begin;

alter table public.employees drop constraint if exists employees_role_check;

alter table public.employees
  add constraint employees_role_check
  check (role in (
    'ceo','cgo','project_director','cto',
    'account_administrator','twitch_moderator','webmaster','graphic_designer',
    'copywriter','video_makers','marketing_specialist','community_manager',
    'agent','intern'
  ));

update public.employees
   set role = 'graphic_designer'
 where email = 'gumelargugum2810@gmail.com';

commit;

select email, full_name, role
from public.employees
where role = 'graphic_designer' or email = 'gumelargugum2810@gmail.com';
