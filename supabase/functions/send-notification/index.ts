import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Supabase Database Webhooks send: { type: "INSERT", table: "messages", record: {...}, schema, old_record }
const TABLE_TO_TYPE: Record<string, string> = {
  messages: 'message',
  follows: 'follow',
  post_likes: 'like',
  comments: 'comment',
};

serve(async (req) => {
  try {
    const payload = await req.json();

    // Support both Supabase webhook format and direct call format
    const table: string = payload.table ?? '';
    const type: string = TABLE_TO_TYPE[table] ?? payload.type ?? '';
    const record = payload.record ?? {};

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let targetUserId: string | null = null;
    let actorId: string | null = null;
    let postId: string | null = null;
    let title = 'VYBE';
    let body = '';
    let notifText = '';
    let pushData: Record<string, string> = {};

    if (type === 'like') {
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', record.post_id).single();
      if (!post || post.user_id === record.user_id) return new Response('skip');
      const { data: liker } = await supabase.from('profiles').select('username').eq('id', record.user_id).single();
      targetUserId = post.user_id;
      actorId = record.user_id;
      postId = record.post_id;
      body = `@${liker?.username} curtiu seu post 🔥`;
      notifText = 'curtiu seu post';
      pushData = { type: 'reaction', postId: record.post_id };

    } else if (type === 'comment') {
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', record.post_id).single();
      if (!post || post.user_id === record.user_id) return new Response('skip');
      const { data: commenter } = await supabase.from('profiles').select('username').eq('id', record.user_id).single();
      targetUserId = post.user_id;
      actorId = record.user_id;
      postId = record.post_id;
      body = `@${commenter?.username} comentou: ${(record.text as string).slice(0, 60)}`;
      notifText = `comentou: ${(record.text as string).slice(0, 60)}`;
      pushData = { type: 'reaction', postId: record.post_id };

    } else if (type === 'follow') {
      const { data: follower } = await supabase.from('profiles').select('username').eq('id', record.follower_id).single();
      targetUserId = record.following_id;
      actorId = record.follower_id;
      body = `@${follower?.username} começou a te seguir 👀`;
      notifText = 'começou a te seguir';
      pushData = { type: 'follow', userId: record.follower_id };

    } else if (type === 'message') {
      const { data: chat } = await supabase.from('chats').select('participant_a, participant_b').eq('id', record.chat_id).single();
      if (!chat) return new Response('skip');
      targetUserId = chat.participant_a === record.sender_id ? chat.participant_b : chat.participant_a;
      actorId = record.sender_id;
      const { data: sender } = await supabase.from('profiles').select('username').eq('id', record.sender_id).single();
      title = `@${sender?.username}`;
      body = (record.text as string).slice(0, 100);
      notifText = (record.text as string).slice(0, 100);
      pushData = { type: 'message', otherId: record.sender_id };

    } else {
      return new Response('unknown type');
    }

    if (!targetUserId || !actorId) return new Response('skip');

    // Save in-app notification
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      actor_id: actorId,
      type,
      post_id: postId ?? null,
      text: notifText,
      read: false,
    });

    // Send push notification
    const { data: tokens } = await supabase.from('push_tokens').select('token').eq('user_id', targetUserId);
    if (!tokens?.length) return new Response('saved, no tokens');

    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(tokens.map((t: any) => ({
        to: t.token,
        title,
        body,
        data: pushData,
        sound: 'default',
        priority: 'high',
      }))),
    });

    return new Response('ok');
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
