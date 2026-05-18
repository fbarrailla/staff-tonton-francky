-- =============================================================================
-- Reset every user's password to "changeme"
-- =============================================================================
-- Runs in two passes:
--   1. UPDATE every existing auth.users row: password → "changeme", confirm
--      any unconfirmed emails.
--   2. CREATE an auth account (confirmed, password "changeme") for any
--      public.employees email that doesn't yet have one — so every team
--      member can sign in.
--
-- Idempotent: safe to re-run. Tell people to change their password right
-- after first sign-in.
-- =============================================================================

-- Pass 1 — reset existing users
update auth.users
set
  encrypted_password = crypt('changeme', gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at         = now();

-- Pass 2 — create missing auth users from public.employees
do $$
declare
  v_row record;
  v_uid uuid;
begin
  for v_row in
    select e.email, e.full_name
    from public.employees e
    where not exists (
      select 1 from auth.users u where u.email = e.email
    )
  loop
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
      v_row.email, crypt('changeme', gen_salt('bf')),
      now(), '',
      '', '', '',
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('display_name', v_row.full_name, 'email_verified', true),
      now(), now(),
      false, false
    );

    insert into auth.identities (
      provider_id, user_id, identity_data,
      provider, last_sign_in_at,
      created_at, updated_at
    ) values (
      v_uid::text, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_row.email, 'email_verified', true),
      'email', null,
      now(), now()
    )
    on conflict (provider, provider_id) do nothing;

    raise notice 'Created %', v_row.email;
  end loop;
end$$;

-- Verify — every employee should now have a confirmed auth account
select
  e.full_name,
  e.email,
  case when u.id is null then '✗ missing' else '✓' end                  as has_auth,
  case when u.email_confirmed_at is null then '✗' else '✓ confirmed' end as confirmed
from public.employees e
left join auth.users u on u.email = e.email
order by e.full_name;
