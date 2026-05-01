-- ================================================
-- VYBE — Comentários
-- ================================================

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename='comments' and policyname='comments_select') then
    create policy "comments_select" on public.comments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='comments' and policyname='comments_insert') then
    create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='comments' and policyname='comments_delete') then
    create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.handle_comment_change()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = OLD.post_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_comment_change') then
    create trigger on_comment_change
      after insert or delete on public.comments
      for each row execute procedure public.handle_comment_change();
  end if;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.comments;
exception when others then null; end $$;
