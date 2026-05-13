-- ────────────────────────────────────────────────────────────────
-- FIX: a tabela public.posts foi criada por uma versão antiga do schema
-- e está sem as colunas que o app usa (lat, lng, etc.).
-- Rode isto no Supabase → SQL Editor. É idempotente e 100% no free tier.
-- ────────────────────────────────────────────────────────────────

alter table public.posts add column if not exists image_url     text;
alter table public.posts add column if not exists caption       text;
alter table public.posts add column if not exists place_name    text;
alter table public.posts add column if not exists place_id      text;
alter table public.posts add column if not exists lat           double precision;
alter table public.posts add column if not exists lng           double precision;
alter table public.posts add column if not exists expires_at    timestamptz;
alter table public.posts add column if not exists created_at    timestamptz not null default now();
alter table public.posts add column if not exists fire_count    integer not null default 0;
alter table public.posts add column if not exists heart_count   integer not null default 0;
alter table public.posts add column if not exists comment_count integer not null default 0;

-- (Opcional, mas recomendado) FK posts.user_id -> profiles.id, caso a tabela antiga não tenha.
-- O app já não depende disso pra montar o feed, mas mantém o schema consistente.
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'posts_user_id_fkey' and conrelid = 'public.posts'::regclass
  ) then
    alter table public.posts
      add constraint posts_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
  end if;
exception when others then null; end $$;

-- Faz o PostgREST (a API do Supabase) recarregar o cache de schema imediatamente
notify pgrst, 'reload schema';
