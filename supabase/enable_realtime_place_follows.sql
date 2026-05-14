-- ────────────────────────────────────────────────────────────────
-- Habilita Realtime nas tabelas de follows (lugares e usuários)
-- para que o app receba eventos quando alguém segue/deixa de seguir.
-- Idempotente — pode rodar várias vezes sem quebrar.
-- ────────────────────────────────────────────────────────────────

do $$
begin
  alter publication supabase_realtime add table public.place_follows;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.follows;
exception
  when duplicate_object then null;
end $$;
