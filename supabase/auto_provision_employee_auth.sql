-- =============================================================================
-- Auto-provision an auth.users row for every employee
-- =============================================================================
-- Two things in one file:
--
--   1. A SECURITY DEFINER function that, given an email + display name:
--      - confirms the existing auth.users row (and resets its password)
--        if one already exists for that email, OR
--      - creates a fresh confirmed auth.users row with password = "changeme"
--        and the matching auth.identities row.
--
--   2. An AFTER INSERT trigger on public.employees that fires the function
--      for every new row. From now on, adding an employee through the UI
--      (or via Excel import) automatically grants them sign-in access — no
--      SQL needed.
--
--   3. A one-time backfill pass that calls the function for every existing
--      employee, so the 30 already-in-the-team people get accounts now.
--
-- Idempotent — safe to re-run. The trigger is dropped + recreated each
-- time, and the function uses COALESCE so re-runs don't double-confirm or
-- corrupt anything.
-- =============================================================================

-- 1. The function ----------------------------------------------------------
create or replace function public.provision_employee_auth(
  p_email      text,
  p_full_name  text
) returns void
language plpgsql
security definer
-- Include `extensions` so pgcrypto's gen_salt/crypt resolve when running
-- under SECURITY DEFINER (which strips the session's default search path).
set search_path = public, extensions
as $$
declare
  v_uid uuid;
begin
  if p_email is null or trim(p_email) = '' then return; end if;

  select id into v_uid from auth.users u where lower(u.email) = lower(p_email);

  if v_uid is null then
    v_uid := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role,
      email, encrypted_password,
      email_confirmed_at, confirmation_token,
      recovery_token, email_change, email_change_token_new,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      is_super_admin, is_sso_user
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_uid, 'authenticated', 'authenticated',
      lower(p_email), crypt('changeme', gen_salt('bf')),
      now(), '',
      '', '', '',
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('display_name', p_full_name, 'email_verified', true),
      now(), now(),
      false, false
    );

    insert into auth.identities (
      provider_id, user_id, identity_data,
      provider, last_sign_in_at,
      created_at, updated_at
    ) values (
      v_uid::text, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', lower(p_email), 'email_verified', true),
      'email', null,
      now(), now()
    )
    on conflict (provider, provider_id) do nothing;
  else
    -- Existing user → confirm + refresh display name. Leave password alone
    -- (we don't want this trigger to wipe a real password the user picked).
    update auth.users u
       set email_confirmed_at = coalesce(u.email_confirmed_at, now()),
           raw_user_meta_data =
             coalesce(u.raw_user_meta_data, '{}'::jsonb)
             || jsonb_build_object('display_name', p_full_name, 'email_verified', true),
           updated_at = now()
     where u.id = v_uid;

    insert into auth.identities (
      provider_id, user_id, identity_data,
      provider, last_sign_in_at,
      created_at, updated_at
    ) values (
      v_uid::text, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', lower(p_email), 'email_verified', true),
      'email', null,
      now(), now()
    )
    on conflict (provider, provider_id) do nothing;
  end if;
end;
$$;

-- 2. The trigger -----------------------------------------------------------
create or replace function public.trg_employees_provision_auth()
returns trigger
language plpgsql
as $$
begin
  perform public.provision_employee_auth(new.email, new.full_name);
  return new;
end;
$$;

drop trigger if exists employees_provision_auth on public.employees;
create trigger employees_provision_auth
  after insert on public.employees
  for each row execute function public.trg_employees_provision_auth();

-- 3. One-time backfill -----------------------------------------------------
do $$
declare r record;
begin
  for r in select email, full_name from public.employees order by full_name loop
    perform public.provision_employee_auth(r.email, r.full_name);
  end loop;
end$$;

-- Verify — every employee + auth status
select
  e.full_name,
  e.email,
  case when u.id is null then '✗ no auth' else '✓' end                   as has_auth,
  case when u.email_confirmed_at is null then '✗' else '✓ confirmed' end as confirmed
from public.employees e
left join auth.users u on lower(u.email) = lower(e.email)
order by e.full_name;
