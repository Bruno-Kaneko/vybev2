-- ────────────────────────────────────────────────────────────────
-- VYBE — 3 features de uma vez:
--   1) user_blocks      (estilo Instagram: bloquear usuário)
--   2) reports          (denunciar post, user ou place)
--   3) daily_checkins   (check-in diário com pontos)
--
-- Idempotente — pode rodar várias vezes sem quebrar.
-- ────────────────────────────────────────────────────────────────


-- ─── 1) USER BLOCKS ──────────────────────────────────────────────
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;

drop policy if exists "blocks_select_own" on public.user_blocks;
create policy "blocks_select_own" on public.user_blocks
  for select using (auth.uid() = blocker_id);

drop policy if exists "blocks_insert_own" on public.user_blocks;
create policy "blocks_insert_own" on public.user_blocks
  for insert with check (auth.uid() = blocker_id);

drop policy if exists "blocks_delete_own" on public.user_blocks;
create policy "blocks_delete_own" on public.user_blocks
  for delete using (auth.uid() = blocker_id);

create index if not exists user_blocks_blocker_idx on public.user_blocks (blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);


-- ─── 2) REPORTS ──────────────────────────────────────────────────
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  target_type  text not null check (target_type in ('post','user','place','comment')),
  target_id    text not null,
  reason       text not null,
  description  text,
  status       text not null default 'pending' check (status in ('pending','reviewed','dismissed','actioned')),
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);

alter table public.reports enable row level security;

-- Usuário só vê suas próprias denúncias
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = reporter_id);

-- Qualquer um pode denunciar (com seu próprio id)
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);

create index if not exists reports_target_idx    on public.reports (target_type, target_id);
create index if not exists reports_reporter_idx  on public.reports (reporter_id);
create index if not exists reports_status_idx    on public.reports (status);


-- ─── 3) DAILY CHECK-INS ──────────────────────────────────────────
create table if not exists public.daily_checkins (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  checkin_date   date not null default current_date,
  points_awarded integer not null default 10,
  created_at     timestamptz not null default now(),
  primary key (user_id, checkin_date)
);

alter table public.daily_checkins enable row level security;

drop policy if exists "checkins_select_own" on public.daily_checkins;
create policy "checkins_select_own" on public.daily_checkins
  for select using (auth.uid() = user_id);

drop policy if exists "checkins_insert_own" on public.daily_checkins;
create policy "checkins_insert_own" on public.daily_checkins
  for insert with check (auth.uid() = user_id);

-- Trigger: ao fazer check-in, soma pontos no profile do usuário
create or replace function public.handle_daily_checkin()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles
     set points = coalesce(points, 0) + NEW.points_awarded
   where id = NEW.user_id;
  return NEW;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_daily_checkin') then
    create trigger on_daily_checkin
      after insert on public.daily_checkins
      for each row execute procedure public.handle_daily_checkin();
  end if;
end $$;


-- Recarrega cache do PostgREST
notify pgrst, 'reload schema';
