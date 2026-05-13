-- ────────────────────────────────────────────────────────────────
-- Integração Google Places — adiciona campos pra cache + link com Google
--
-- A tabela public.places já existe com schema próprio (vibe, crowd, queue, etc).
-- Esta migration só ADICIONA o que falta — não destrói nada.
--
-- Idempotente — pode rodar várias vezes sem quebrar.
-- ────────────────────────────────────────────────────────────────

-- Campo principal: ID do Google Places (ex: "ChIJN1t_tDeuEmsRUsoyG83frY4")
alter table public.places add column if not exists google_place_id  text;
-- Tipos do Google (bar, night_club, restaurant…) — separado do "tags" que é user-defined
alter table public.places add column if not exists types            text[] not null default '{}';
alter table public.places add column if not exists primary_type     text;
-- Referência de foto do Google (pra montar URL no app)
alter table public.places add column if not exists photo_ref        text;
-- Contador de posts ativos (atualizado pelo app)
alter table public.places add column if not exists active_post_count integer not null default 0;
alter table public.places add column if not exists updated_at       timestamptz not null default now();

-- Unique constraint no google_place_id (idempotente)
do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'places_google_place_id_key' and conrelid = 'public.places'::regclass
  ) then
    alter table public.places add constraint places_google_place_id_key unique (google_place_id);
  end if;
exception when others then null; end $$;

-- Índices
create index if not exists places_lat_lng_idx        on public.places (lat, lng);
create index if not exists places_types_idx          on public.places using gin (types);
create index if not exists places_google_id_idx      on public.places (google_place_id);

-- RLS — permite leitura pública + escrita por autenticados (cache vem do app)
alter table public.places enable row level security;

drop policy if exists "places_select_all" on public.places;
create policy "places_select_all" on public.places for select using (true);

drop policy if exists "places_insert_authenticated" on public.places;
create policy "places_insert_authenticated" on public.places
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "places_update_authenticated" on public.places;
create policy "places_update_authenticated" on public.places
  for update using (auth.role() = 'authenticated');

-- PostgREST: recarregar schema
notify pgrst, 'reload schema';
