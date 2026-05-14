-- ────────────────────────────────────────────────────────────────
-- Adiciona campos pra rastrear aceite dos Termos de Uso e
-- Política de Privacidade. Necessário pra publicação na Play Store
-- e compliance básico com LGPD.
-- ────────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists terms_accepted_at  timestamptz;
alter table public.profiles add column if not exists privacy_accepted_at timestamptz;

notify pgrst, 'reload schema';
