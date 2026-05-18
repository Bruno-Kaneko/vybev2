-- ────────────────────────────────────────────────────────────────
-- Muda duração padrão dos stories de 24h para 6h
-- (também ajusta stories ativos que ainda não foram visualizados)
-- ────────────────────────────────────────────────────────────────

-- 1) Muda o default da coluna pra 6h
alter table public.stories
  alter column expires_at set default (now() + interval '6 hours');

-- 2) Atualiza stories ainda ativos pra usar a nova janela (created_at + 6h)
--    Stories que já passaram de 6h desde criação vão expirar imediatamente
update public.stories
   set expires_at = created_at + interval '6 hours'
 where expires_at > now();

notify pgrst, 'reload schema';
