-- ────────────────────────────────────────────────────────────────
-- VYBE — Stories (status temporário, 24h)
--
-- Tabela `stories` guarda os stories (foto + texto opcional)
-- Tabela `story_views` guarda quem viu qual story (pro owner ver lista)
-- ────────────────────────────────────────────────────────────────


-- ─── STORIES ──────────────────────────────────────────────────────
create table if not exists public.stories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  media_url   text,                                -- url da foto (null se for só texto)
  caption     text,                                -- texto sobreposto / legenda
  bg_color    text,                                -- cor de fundo quando é só texto (hex)
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now(),
  check (media_url is not null or caption is not null)
);

alter table public.stories enable row level security;

-- SELECT: todos os autenticados veem stories que não expiraram
drop policy if exists "stories_select_active" on public.stories;
create policy "stories_select_active" on public.stories
  for select using (expires_at > now());

-- INSERT: só com seu próprio user_id
drop policy if exists "stories_insert_own" on public.stories;
create policy "stories_insert_own" on public.stories
  for insert with check (auth.uid() = user_id);

-- DELETE: só seus próprios stories
drop policy if exists "stories_delete_own" on public.stories;
create policy "stories_delete_own" on public.stories
  for delete using (auth.uid() = user_id);

create index if not exists stories_user_expires_idx on public.stories (user_id, expires_at desc);
create index if not exists stories_expires_idx       on public.stories (expires_at);


-- ─── STORY VIEWS ──────────────────────────────────────────────────
create table if not exists public.story_views (
  story_id  uuid not null references public.stories(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

alter table public.story_views enable row level security;

-- SELECT: você vê suas próprias visualizações OU as visualizações dos seus stories
drop policy if exists "views_select_own_or_owner" on public.story_views;
create policy "views_select_own_or_owner" on public.story_views
  for select using (
    auth.uid() = viewer_id
    or exists (select 1 from public.stories s where s.id = story_id and s.user_id = auth.uid())
  );

-- INSERT: só com seu próprio viewer_id
drop policy if exists "views_insert_own" on public.story_views;
create policy "views_insert_own" on public.story_views
  for insert with check (auth.uid() = viewer_id);

create index if not exists views_story_idx on public.story_views (story_id);


-- ─── BUCKET DE STORAGE pra mídia dos stories ──────────────────────
-- (executar manualmente no painel Storage se necessário, mas tentamos via SQL)
insert into storage.buckets (id, name, public)
values ('stories', 'stories', true)
on conflict (id) do nothing;

-- Policies do bucket
do $$ begin
  -- Permite leitura pública das fotos de story
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'stories_public_read') then
    create policy "stories_public_read" on storage.objects
      for select using (bucket_id = 'stories');
  end if;
  -- Permite upload autenticado
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'stories_authenticated_insert') then
    create policy "stories_authenticated_insert" on storage.objects
      for insert with check (bucket_id = 'stories' and auth.role() = 'authenticated');
  end if;
  -- Permite delete do próprio arquivo
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'stories_delete_own') then
    create policy "stories_delete_own" on storage.objects
      for delete using (bucket_id = 'stories' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;

-- Habilita Realtime nas duas tabelas (pra StoryBar atualizar ao vivo)
do $$ begin
  alter publication supabase_realtime add table public.stories;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.story_views;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
