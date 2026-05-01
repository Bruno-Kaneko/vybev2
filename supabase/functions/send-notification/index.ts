import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  try {
    const { type, record } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let targetUserId: string | null = null;
    let title = 'VYBE';
    let body = '';
    let data: Record<string, string> = {};

    if (type === 'like') {
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', record.post_id).single();
      if (!post || post.user_id === record.user_id) return new Response('skip');
      const { data: liker } = await supabase.from('profiles').select('username').eq('id', record.user_id).single();
      targetUserId = post.user_id;
      body = `@${liker?.username} curtiu seu post 🔥`;
      data = { type: 'reaction', postId: record.post_id };

    } else if (type === 'comment') {
      const { data: post } = await supabase.from('posts').select('user_id').eq('id', record.post_id).single();
      if (!post || post.user_id === record.user_id) return new Response('skip');
      const { data: commenter } = await supabase.from('profiles').select('username').eq('id', record.user_id).single();
      targetUserId = post.user_id;
      body = `@${commenter?.username} comentou: ${(record.text as string).slice(0, 60)}`;
      data = { type: 'reaction', postId: record.post_id };

    } else if (type === 'follow') {
      const { data: follower } = await supabase.from('profiles').select('username').eq('id', record.follower_id).single();
      targetUserId = record.following_id;
      body = `@${follower?.username} começou a te seguir 👀`;
      data = { type: 'follow', userId: record.follower_id };

    } else if (type === 'message') {
      const { data: chat } = await supabase.from('chats').select('participant_a, participant_b').eq('id', record.chat_id).single();
      if (!chat) return new Response('skip');
      targetUserId = chat.participant_a === record.sender_id ? chat.participant_b : chat.participant_a;
      const { data: sender } = await supabase.from('profiles').select('username').eq('id', record.sender_id).single();
      title = `@${sender?.username}`;
      body = (record.text as string).slice(0, 100);
      data = { type: 'message', otherId: record.sender_id };
    }

    if (!targetUserId) return new Response('skip');

    const { data: tokens } = await supabase.from('push_tokens').select('token').eq('user_id', targetUserId);
    if (!tokens?.length) return new Response('no tokens');

    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(tokens.map(t => ({
        to: t.token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      }))),
    });

    return new Response('ok');
  } catch (e) {
    return new Response(String(e), { status: 500 });
  }
});
