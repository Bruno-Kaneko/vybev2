-- ================================================
-- VYBE — Schema (versão corrigida, idempotente)
-- Pode rodar múltiplas vezes sem erro
-- ================================================

-- ── PROFILES: adiciona colunas faltando ──────────
alter table public.profiles add column if not exists display_name      text;
alter table public.profiles add column if not exists avatar_url        text;
alter table public.profiles add column if not exists bio               text;
alter table public.profiles add column if not exists instagram         text;
alter table public.profiles add column if not exists points            integer not null default 0;
alter table public.profiles add column if not exists relationship_status text;
alter table public.profiles add column if not exists follower_count    integer not null default 0;
alter table public.profiles add column if not exists following_count   integer not null default 0;

alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_select') then
    create policy "profiles_select" on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_insert') then
    create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_update') then
    create policy "profiles_update" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;

-- Trigger: auto-criar perfil no cadastro
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created') then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

-- ── POSTS ─────────────────────────────────────────
create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  image_url     text not null,
  caption       text,
  place_name    text not null,
  place_id      text,
  lat           double precision not null,
  lng           double precision not null,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now(),
  fire_count    integer not null default 0,
  heart_count   integer not null default 0,
  comment_count integer not null default 0
);

alter table public.posts enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='posts' and policyname='posts_select') then
    create policy "posts_select" on public.posts for select using (expires_at > now() or auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='posts' and policyname='posts_insert') then
    create policy "posts_insert" on public.posts for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='posts' and policyname='posts_delete') then
    create policy "posts_delete" on public.posts for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ── REACTIONS ─────────────────────────────────────
create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in ('fire','heart')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, type)
);

alter table public.reactions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='reactions' and policyname='reactions_select') then
    create policy "reactions_select" on public.reactions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='reactions' and policyname='reactions_insert') then
    create policy "reactions_insert" on public.reactions for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='reactions' and policyname='reactions_delete') then
    create policy "reactions_delete" on public.reactions for delete using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.handle_reaction_change()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.type = 'fire' then
      update public.posts set fire_count  = fire_count  + 1 where id = NEW.post_id;
    else
      update public.posts set heart_count = heart_count + 1 where id = NEW.post_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.type = 'fire' then
      update public.posts set fire_count  = greatest(fire_count  - 1, 0) where id = OLD.post_id;
    else
      update public.posts set heart_count = greatest(heart_count - 1, 0) where id = OLD.post_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_reaction_change') then
    create trigger on_reaction_change
      after insert or delete on public.reactions
      for each row execute procedure public.handle_reaction_change();
  end if;
end $$;

-- ── FOLLOWS ───────────────────────────────────────
create table if not exists public.follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='follows' and policyname='follows_select') then
    create policy "follows_select" on public.follows for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='follows' and policyname='follows_insert') then
    create policy "follows_insert" on public.follows for insert with check (auth.uid() = follower_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='follows' and policyname='follows_delete') then
    create policy "follows_delete" on public.follows for delete using (auth.uid() = follower_id);
  end if;
end $$;

create or replace function public.handle_follow_change()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = NEW.follower_id;
    update public.profiles set follower_count  = follower_count  + 1 where id = NEW.following_id;
  elsif TG_OP = 'DELETE' then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = OLD.follower_id;
    update public.profiles set follower_count  = greatest(follower_count  - 1, 0) where id = OLD.following_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_follow_change') then
    create trigger on_follow_change
      after insert or delete on public.follows
      for each row execute procedure public.handle_follow_change();
  end if;
end $$;

-- ── CHATS ─────────────────────────────────────────
create table if not exists public.chats (
  id              uuid primary key default gen_random_uuid(),
  participant_a   uuid not null references public.profiles(id) on delete cascade,
  participant_b   uuid not null references public.profiles(id) on delete cascade,
  last_message    text,
  last_message_at timestamptz,
  unread_a        integer not null default 0,
  unread_b        integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table public.chats enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='chats' and policyname='chats_select') then
    create policy "chats_select" on public.chats for select
      using (auth.uid() = participant_a or auth.uid() = participant_b);
  end if;
  if not exists (select 1 from pg_policies where tablename='chats' and policyname='chats_insert') then
    create policy "chats_insert" on public.chats for insert
      with check (auth.uid() = participant_a or auth.uid() = participant_b);
  end if;
  if not exists (select 1 from pg_policies where tablename='chats' and policyname='chats_update') then
    create policy "chats_update" on public.chats for update
      using (auth.uid() = participant_a or auth.uid() = participant_b);
  end if;
end $$;

-- ── MESSAGES ──────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references public.chats(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='messages_select') then
    create policy "messages_select" on public.messages for select
      using (exists (
        select 1 from public.chats c
        where c.id = chat_id
        and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
      ));
  end if;
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='messages_insert') then
    create policy "messages_insert" on public.messages for insert
      with check (
        auth.uid() = sender_id and
        exists (
          select 1 from public.chats c
          where c.id = chat_id
          and (c.participant_a = auth.uid() or c.participant_b = auth.uid())
        )
      );
  end if;
end $$;

-- ── PUSH TOKENS ───────────────────────────────────
create table if not exists public.push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  token      text not null,
  platform   text,
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

alter table public.push_tokens enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='push_tokens' and policyname='push_tokens_all') then
    create policy "push_tokens_all" on public.push_tokens for all using (auth.uid() = user_id);
  end if;
end $$;

-- ── STORAGE: bucket posts ─────────────────────────
insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='posts_storage_select') then
    create policy "posts_storage_select" on storage.objects
      for select using (bucket_id = 'posts');
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='posts_storage_insert') then
    create policy "posts_storage_insert" on storage.objects
      for insert with check (bucket_id = 'posts' and auth.uid() is not null);
  end if;
  if not exists (select 1 from pg_policies where tablename='objects' and policyname='posts_storage_delete') then
    create policy "posts_storage_delete" on storage.objects
      for delete using (bucket_id = 'posts' and auth.uid() is not null);
  end if;
end $$;

-- ── NOTIFICATIONS ─────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  actor_id   uuid not null references public.profiles(id) on delete cascade,
  type       text not null check (type in ('like', 'follow', 'comment', 'message')),
  post_id    uuid,
  text       text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications_select') then
    create policy "notifications_select" on public.notifications
      for select using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications_update') then
    create policy "notifications_update" on public.notifications
      for update using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='notifications' and policyname='notifications_delete') then
    create policy "notifications_delete" on public.notifications
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ── REALTIME ──────────────────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.chats;
exception when others then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;

-- ── SEED: cria perfil do usuário de teste ─────────
insert into public.profiles (id, username, display_name)
select id, split_part(email, '@', 1), split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;
