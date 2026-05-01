-- ================================================
-- VYBE — Usuários de teste
-- Roda no SQL Editor do Supabase
-- Login: michel@vybe.test / vybe1234
--        bruno@vybe.test  / vybe1234
-- ================================================

do $$
declare
  michel_id uuid := gen_random_uuid();
  bruno_id  uuid := gen_random_uuid();
begin

  -- Cria usuários no auth (já confirmados, sem precisar de email)
  insert into auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values
  (
    michel_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'michel@vybe.test',
    crypt('vybe1234', gen_salt('bf')),
    now(),
    '{"username":"michel"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    bruno_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'bruno@vybe.test',
    crypt('vybe1234', gen_salt('bf')),
    now(),
    '{"username":"bruno"}'::jsonb,
    now(), now(), '', '', '', ''
  );

  -- Cria perfis com dados completos
  insert into public.profiles (
    id, username, display_name, bio, avatar_url, points, follower_count, following_count
  ) values
  (
    michel_id,
    'michel',
    'Michel',
    'Sempre no rolê 🎉',
    'https://i.pravatar.cc/150?img=12',
    420,
    87,
    54
  ),
  (
    bruno_id,
    'bruno',
    'Bruno',
    'São Paulo by night 🌙',
    'https://i.pravatar.cc/150?img=8',
    1100,
    312,
    140
  )
  on conflict (id) do update set
    display_name   = excluded.display_name,
    bio            = excluded.bio,
    avatar_url     = excluded.avatar_url,
    points         = excluded.points,
    follower_count = excluded.follower_count,
    following_count = excluded.following_count;

end;
$$;
