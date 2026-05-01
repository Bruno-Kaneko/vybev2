-- ================================================
-- VYBE — Push Notifications via pg_net
-- Roda no SQL Editor do Supabase
-- ================================================

-- Habilita extensão de HTTP (pg_net)
create extension if not exists pg_net;

-- ── Função central de envio ───────────────────────
create or replace function public.send_push(
  p_user_id uuid,
  p_title   text,
  p_body    text,
  p_data    jsonb default '{}'
) returns void language plpgsql security definer as $$
declare
  v_token text;
begin
  select token into v_token
  from public.push_tokens
  where user_id = p_user_id
  order by created_at desc
  limit 1;

  if v_token is null then return; end if;

  perform net.http_post(
    url     := 'https://exp.host/api/v2/push/send',
    body    := jsonb_build_object(
                 'to',    v_token,
                 'title', p_title,
                 'body',  p_body,
                 'sound', 'default',
                 'data',  p_data
               ),
    headers := '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb
  );
end;
$$;

-- ── Notificar nova mensagem ───────────────────────
create or replace function public.notify_message()
returns trigger language plpgsql security definer as $$
declare
  v_sender_name text;
  v_recipient   uuid;
begin
  select coalesce(display_name, username) into v_sender_name
  from public.profiles where id = NEW.sender_id;

  select case
    when participant_a = NEW.sender_id then participant_b
    else participant_a
  end into v_recipient
  from public.chats where id = NEW.chat_id;

  perform public.send_push(
    v_recipient,
    v_sender_name || ' te mandou mensagem',
    NEW.text,
    jsonb_build_object('type', 'message', 'chatId', NEW.chat_id::text, 'otherId', NEW.sender_id::text)
  );
  return NEW;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_new_message_push') then
    create trigger on_new_message_push
      after insert on public.messages
      for each row execute procedure public.notify_message();
  end if;
end $$;

-- ── Notificar novo seguidor ───────────────────────
create or replace function public.notify_follow()
returns trigger language plpgsql security definer as $$
declare
  v_name text;
begin
  select coalesce(display_name, username) into v_name
  from public.profiles where id = NEW.follower_id;

  perform public.send_push(
    NEW.following_id,
    'Novo seguidor!',
    v_name || ' começou a te seguir',
    jsonb_build_object('type', 'follow', 'userId', NEW.follower_id::text)
  );
  return NEW;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_new_follow_push') then
    create trigger on_new_follow_push
      after insert on public.follows
      for each row execute procedure public.notify_follow();
  end if;
end $$;

-- ── Notificar reação no post ──────────────────────
create or replace function public.notify_reaction()
returns trigger language plpgsql security definer as $$
declare
  v_name     text;
  v_owner    uuid;
  v_emoji    text;
begin
  select coalesce(display_name, username) into v_name
  from public.profiles where id = NEW.user_id;

  select user_id into v_owner
  from public.posts where id = NEW.post_id;

  -- Não notifica se a pessoa reagiu ao próprio post
  if v_owner = NEW.user_id then return NEW; end if;

  v_emoji := case when NEW.type = 'fire' then '🔥' else '❤️' end;

  perform public.send_push(
    v_owner,
    v_name || ' reagiu ao seu post',
    v_emoji || ' ' || v_name || ' curtiu seu post',
    jsonb_build_object('type', 'reaction', 'postId', NEW.post_id::text)
  );
  return NEW;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'on_new_reaction_push') then
    create trigger on_new_reaction_push
      after insert on public.reactions
      for each row execute procedure public.notify_reaction();
  end if;
end $$;
