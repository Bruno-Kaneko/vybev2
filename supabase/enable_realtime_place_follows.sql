-- ────────────────────────────────────────────────────────────────
-- Habilita Realtime na tabela place_follows para que o app receba
-- eventos quando alguém segue/deixa de seguir um lugar.
-- Idempotente — pode rodar várias vezes sem quebrar.
-- ────────────────────────────────────────────────────────────────

do $$
begin
  alter publication supabase_realtime add table public.place_follows;
exception
  when duplicate_object then null;
end $$;
