-- Cache de lugares vindos do Google Places API
-- Objetivo: economizar chamadas (custa $$$) e ter lugar central pra extender com dados próprios
--           (vibe, lotação, posts ativos, etc) no futuro

create table if not exists public.places (
  id            text primary key,                -- Google place_id (ex: "ChIJ...")
  name          text not null,
  address       text not null default '',
  neighborhood  text,
  lat           double precision not null,
  lng           double precision not null,
  types         text[] not null default '{}',
  primary_type  text,
  photo_ref     text,                            -- referência de foto do Google (gera URL no app)
  -- Campos próprios (preenchidos pelos usuários no futuro)
  vibe          text,
  crowd_level   integer,                         -- 0-5
  active_post_count integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists places_lat_lng_idx on public.places (lat, lng);
create index if not exists places_types_idx on public.places using gin (types);

alter table public.places enable row level security;

-- Leitura pública (qualquer usuário autenticado pode ver lugares)
drop policy if exists "places_select_all" on public.places;
create policy "places_select_all" on public.places
  for select using (true);

-- Insert/Update: apenas usuários autenticados podem inserir (cache vem do app)
drop policy if exists "places_insert_authenticated" on public.places;
create policy "places_insert_authenticated" on public.places
  for insert with check (auth.role() = 'authenticated');

drop policy if exists "places_update_authenticated" on public.places;
create policy "places_update_authenticated" on public.places
  for update using (auth.role() = 'authenticated');
