-- ────────────────────────────────────────────────────────────────
-- Adiciona coluna photo_url para guardar a URL resolvida do Google CDN
-- (lh3.googleusercontent.com) em vez de só a referência da Places API.
--
-- Motivo: o endpoint /v1/{ref}/media não funciona bem no <Image> direto.
-- A URL CDN é estável, carrega rápido e não gasta cota da API.
-- ────────────────────────────────────────────────────────────────

alter table public.places add column if not exists photo_url text;

notify pgrst, 'reload schema';
