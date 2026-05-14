-- ────────────────────────────────────────────────────────────────
-- Zera follower_count de TODOS os places e limpa place_follows.
--
-- Motivo: lugares puxados do Google não foram seguidos por ninguém ainda.
-- Qualquer follower_count > 0 era lixo do MOCK_PLACES anterior ou de
-- testes antigos.
-- ────────────────────────────────────────────────────────────────

-- Limpa quem segue o que (volta tudo do zero)
delete from public.place_follows;

-- Zera o contador de seguidores em todos os lugares
update public.places set follower_count = 0;

-- Garante que o default para novos lugares seja 0 (caso não esteja)
alter table public.places alter column follower_count set default 0;

-- Recarrega o cache do PostgREST
notify pgrst, 'reload schema';
