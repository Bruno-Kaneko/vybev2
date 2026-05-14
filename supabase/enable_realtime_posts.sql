-- ────────────────────────────────────────────────────────────────
-- Habilita Realtime na tabela posts para que o heatmap do mapa
-- atualize quando alguém posta (ou um post expira).
-- Idempotente.
-- ────────────────────────────────────────────────────────────────

do $$
begin
  alter publication supabase_realtime add table public.posts;
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
