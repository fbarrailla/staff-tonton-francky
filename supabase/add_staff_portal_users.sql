-- =============================================================================
-- Bulk add (or reset) 28 staff portal accounts
-- =============================================================================
-- For every email in the list:
--   - if the user doesn't exist in auth.users → create them (confirmed)
--   - if they do exist → keep them, just reset password + confirm
-- Password is always set to 'changeme'. Tell people to change it on first
-- sign-in (Settings → Account → Password).
--
-- Idempotent — safe to re-run. The trailing SELECT prints every email +
-- whether it has an auth account and is confirmed.
-- =============================================================================

do $bulk$
declare
  emails constant text[] := array[
    'abrielzildanalfajri04@gmail.com',
    'arazahraa91@gmail.com',
    'lollygita@gmail.com',
    'jonajagadjava@gmail.com',
    'yatiramadasari@gmail.com',
    'avindamarianaa28@gmail.com',
    'itsmeyaniyani@gmail.com',
    'rochmahmiya@gmail.com',
    'st.hanifah10@gmail.com',
    'nurharina7391@gmail.com',
    'uswatunhasanahnana1998@gmail.com',
    'salimahalfiyah@gmail.com',
    'gumelargugum2810@gmail.com',
    'kurniarahayu194@gmail.com',
    'inantafebbya@gmail.com',
    'guhiryadi@gmail.com',
    'shaqueenaonly@gmail.com',
    'setiawanliem33@gmail.com',
    'hrvnnaagstne22@gmail.com',
    'nengsihrestianti@gmail.com',
    'francois.barrailla@gmail.com',
    'adryxjatin@gmail.com',
    'nanabymoon@gmail.com',
    'nicolasfleurie1@gmail.com',
    'novitaputrikusuma@gmail.com',
    'punitpunia005@gmail.com',
    'rahmattz321@gmail.com',
    'jungselly865@gmail.com',
    'krisno0611@gmail.com',
    'msvictoria.salazar@gmail.com',
    'oktavianingsih171096@gmail.com'
  ];
  v_email text;
  v_uid   uuid;
  v_name  text;
begin
  foreach v_email in array emails loop
    -- Display name: prefer the public.employees row, otherwise capitalise
    -- the local-part of the email so we don't store "raw" usernames.
    select e.full_name into v_name
      from public.employees e where lower(e.email) = lower(v_email);
    if v_name is null then
      v_name := initcap(replace(split_part(v_email, '@', 1), '.', ' '));
    end if;

    select id into v_uid from auth.users u where u.email = v_email;

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
        v_email, crypt('changeme', gen_salt('bf')),
        now(), '',
        '', '', '',
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object('display_name', v_name, 'email_verified', true),
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
        'email', null, now(), now()
      )
      on conflict (provider, provider_id) do nothing;

      raise notice 'Created %', v_email;
    else
      update auth.users u
        set encrypted_password = crypt('changeme', gen_salt('bf')),
            email_confirmed_at = coalesce(u.email_confirmed_at, now()),
            raw_user_meta_data =
              coalesce(u.raw_user_meta_data, '{}'::jsonb)
              || jsonb_build_object('display_name', v_name, 'email_verified', true),
            updated_at = now()
       where u.id = v_uid;

      insert into auth.identities (
        provider_id, user_id, identity_data,
        provider, last_sign_in_at,
        created_at, updated_at
      ) values (
        v_uid::text, v_uid,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', null, now(), now()
      )
      on conflict (provider, provider_id) do nothing;

      raise notice 'Updated %', v_email;
    end if;
  end loop;
end
$bulk$;

-- Verify — every requested email + its auth status
select
  v.email,
  case when u.id is null then '✗ missing' else '✓' end                  as has_auth,
  case when u.email_confirmed_at is null then '✗' else '✓ confirmed' end as confirmed,
  u.raw_user_meta_data ->> 'display_name'                                as display_name
from (
  values
    ('abrielzildanalfajri04@gmail.com'),('arazahraa91@gmail.com'),
    ('lollygita@gmail.com'),('jonajagadjava@gmail.com'),
    ('yatiramadasari@gmail.com'),('avindamarianaa28@gmail.com'),
    ('itsmeyaniyani@gmail.com'),('rochmahmiya@gmail.com'),
    ('st.hanifah10@gmail.com'),('nurharina7391@gmail.com'),
    ('uswatunhasanahnana1998@gmail.com'),('salimahalfiyah@gmail.com'),
    ('gumelargugum2810@gmail.com'),('kurniarahayu194@gmail.com'),
    ('inantafebbya@gmail.com'),('guhiryadi@gmail.com'),
    ('shaqueenaonly@gmail.com'),('setiawanliem33@gmail.com'),
    ('hrvnnaagstne22@gmail.com'),('nengsihrestianti@gmail.com'),
    ('francois.barrailla@gmail.com'),('adryxjatin@gmail.com'),
    ('nanabymoon@gmail.com'),('nicolasfleurie1@gmail.com'),
    ('novitaputrikusuma@gmail.com'),('punitpunia005@gmail.com'),
    ('rahmattz321@gmail.com'),('jungselly865@gmail.com'),
    ('krisno0611@gmail.com'),('msvictoria.salazar@gmail.com'),
    ('oktavianingsih171096@gmail.com')
) as v(email)
left join auth.users u on u.email = v.email
order by v.email;
