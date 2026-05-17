-- =============================================================================
-- Seed admin users for Staff — Tonton Francky
-- =============================================================================
-- Creates 7 users with password "changeme" and pre-confirms them so they can
-- log in immediately. Idempotent: safe to re-run (skips users that already
-- exist and confirms ones that aren't yet confirmed).
--
-- Run this in the Supabase SQL editor (it executes as the `postgres` role,
-- which has write access to `auth.users` and `auth.identities`).
--
-- After running:
--   - 7 confirmed users with email + password "changeme"
--   - All can log in via the backoffice
--   - Change passwords from the app once logged in
-- =============================================================================

do $seed$
declare
  users constant text[][] := array[
    array['adryxjatin@gmail.com',         'adryx jatin'],
    array['punitpunia005@gmail.com',      'punitpunia005'],
    array['rahmattz321@gmail.com',        'rahmattz321'],
    array['francois.barrailla@gmail.com', 'François Barrailla'],
    array['nanabymoon@gmail.com',         'nanabymoon'],
    array['jungselly865@gmail.com',       'jungselly865'],
    array['nicolasfleurie1@gmail.com',    'nicolasfleurie1']
  ];
  v_row          text[];
  v_uid          uuid;
  v_email        text;
  v_display_name text;
  v_encrypted    text;
begin
  foreach v_row slice 1 in array users loop
    v_email        := v_row[1];
    v_display_name := v_row[2];

    -- Does this user already exist?
    select u.id into v_uid from auth.users u where u.email = v_email;

    if v_uid is null then
      -- Create from scratch
      v_uid := gen_random_uuid();
      v_encrypted := crypt('changeme', gen_salt('bf'));

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
        v_email, v_encrypted,
        now(), '',
        '', '', '',
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object('display_name', v_display_name, 'email_verified', true),
        now(), now(),
        false, false
      );

      insert into auth.identities (
        provider_id, user_id, identity_data,
        provider, last_sign_in_at,
        created_at, updated_at
      ) values (
        v_uid::text, v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', null,
        now(), now()
      )
      on conflict (provider, provider_id) do nothing;

      raise notice 'Created %', v_email;
    else
      -- Existing user (e.g. created earlier via signup) — confirm + reset password
      update auth.users u
        set email_confirmed_at = coalesce(u.email_confirmed_at, now()),
            encrypted_password = crypt('changeme', gen_salt('bf')),
            raw_user_meta_data =
              coalesce(u.raw_user_meta_data, '{}'::jsonb)
              || jsonb_build_object('display_name', v_display_name, 'email_verified', true),
            updated_at = now()
        where u.id = v_uid;

      -- Ensure email identity exists (older signups may lack it under some Supabase versions)
      insert into auth.identities (
        provider_id, user_id, identity_data,
        provider, last_sign_in_at,
        created_at, updated_at
      ) values (
        v_uid::text, v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', null,
        now(), now()
      )
      on conflict (provider, provider_id) do nothing;

      raise notice 'Updated %', v_email;
    end if;
  end loop;
end
$seed$;

-- Verify
select email, email_confirmed_at is not null as confirmed, created_at
from auth.users
where email = any (array[
  'adryxjatin@gmail.com','punitpunia005@gmail.com','rahmattz321@gmail.com',
  'francois.barrailla@gmail.com','nanabymoon@gmail.com',
  'jungselly865@gmail.com','nicolasfleurie1@gmail.com'
])
order by email;
