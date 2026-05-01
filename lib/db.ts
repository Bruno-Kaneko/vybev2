import { supabase } from './supabase';
import type { Post, User } from '@/types';

// ────────────────────────────────────────────────
// DB row types
// ────────────────────────────────────────────────

export type DBProfile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  instagram: string | null;
  points: number;
  relationship_status: string | null;
  follower_count: number;
  following_count: number;
  created_at: string;
};

export type DBPost = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  place_name: string;
  place_id: string | null;
  lat: number;
  lng: number;
  expires_at: string;
  created_at: string;
  fire_count: number;
  heart_count: number;
  comment_count: number;
  profiles: DBProfile;
};

export type DBMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

export type DBChat = {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_a: number;
  unread_b: number;
  created_at: string;
  profile_a: DBProfile | null;
  profile_b: DBProfile | null;
};

// ────────────────────────────────────────────────
// Mappers DB → App types
// ────────────────────────────────────────────────

export function mapProfile(p: DBProfile): User {
  return {
    id: p.id,
    username: p.username,
    displayName: p.display_name ?? p.username,
    avatar: p.avatar_url ?? '',
    bio: p.bio ?? undefined,
    instagram: p.instagram ?? undefined,
    points: p.points,
    followers: p.follower_count,
    following: p.following_count,
    createdAt: new Date(p.created_at).getTime(),
    relationshipStatus: (p.relationship_status as any) ?? undefined,
  };
}

function mapPost(row: DBPost): Post {
  return {
    id: row.id,
    userId: row.user_id,
    user: mapProfile(row.profiles),
    imageUrl: row.image_url,
    caption: row.caption ?? undefined,
    placeName: row.place_name,
    placeId: row.place_id ?? undefined,
    location: { latitude: row.lat, longitude: row.lng },
    expiresAt: new Date(row.expires_at).getTime(),
    createdAt: new Date(row.created_at).getTime(),
    reactions: { fire: row.fire_count, heart: row.heart_count },
    commentCount: row.comment_count,
  };
}

const POST_SELECT = `
  id, user_id, image_url, caption, place_name, place_id,
  lat, lng, expires_at, created_at, fire_count, heart_count, comment_count,
  profiles (
    id, username, display_name, avatar_url, bio, instagram, points,
    relationship_status, follower_count, following_count, created_at
  )
`;

// ────────────────────────────────────────────────
// PROFILE
// ────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return mapProfile(data as DBProfile);
}

export async function ensureProfile(userId: string, email: string, username?: string) {
  const name = username ?? email.split('@')[0];
  await supabase.from('profiles').upsert(
    { id: userId, username: name, display_name: name },
    { onConflict: 'id', ignoreDuplicates: true }
  );
}

// ────────────────────────────────────────────────
// POSTS
// ────────────────────────────────────────────────

export async function getFeedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return (data as unknown as DBPost[]).map(mapPost);
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as unknown as DBPost[]).map(mapPost);
}

export async function getActivePostLocations(): Promise<Array<{ lat: number; lng: number }>> {
  const { data } = await supabase
    .from('posts')
    .select('lat, lng')
    .gt('expires_at', new Date().toISOString());
  return (data ?? []) as Array<{ lat: number; lng: number }>;
}

function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = reject;
    xhr.responseType = 'blob';
    xhr.open('GET', uri);
    xhr.send();
  });
}

export async function uploadPostImage(userId: string, localUri: string): Promise<string> {
  const path = `${userId}/${Date.now()}.jpg`;
  const blob = await uriToBlob(localUri);
  const { error } = await supabase.storage
    .from('posts')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('posts').getPublicUrl(path);
  return data.publicUrl;
}

export async function createPost(params: {
  userId: string;
  imageUrl: string;
  caption?: string;
  placeName: string;
  placeId?: string;
  lat: number;
  lng: number;
  durationHours: number;
}): Promise<string> {
  const expiresAt = new Date(
    Date.now() + params.durationHours * 3600 * 1000
  ).toISOString();
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: params.userId,
      image_url: params.imageUrl,
      caption: params.caption ?? null,
      place_name: params.placeName,
      place_id: params.placeId ?? null,
      lat: params.lat,
      lng: params.lng,
      expires_at: expiresAt,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

// ────────────────────────────────────────────────
// FOLLOWS
// ────────────────────────────────────────────────

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  return !!data;
}

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw error;
}

// ────────────────────────────────────────────────
// CHATS
// ────────────────────────────────────────────────

export async function getOrCreateChat(
  myId: string,
  otherId: string
): Promise<string> {
  const [a, b] = [myId, otherId].sort();
  const { data: existing } = await supabase
    .from('chats')
    .select('id')
    .or(
      `and(participant_a.eq.${a},participant_b.eq.${b}),and(participant_a.eq.${b},participant_b.eq.${a})`
    )
    .maybeSingle();
  if (existing) return existing.id as string;

  const { data, error } = await supabase
    .from('chats')
    .insert({ participant_a: a, participant_b: b })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function getChats(userId: string): Promise<DBChat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select(
      `id, participant_a, participant_b, last_message, last_message_at,
       unread_a, unread_b, created_at,
       profile_a:profiles!participant_a(id,username,display_name,avatar_url),
       profile_b:profiles!participant_b(id,username,display_name,avatar_url)`
    )
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) return [];
  return (data ?? []) as unknown as DBChat[];
}

export async function getMessages(chatId: string): Promise<DBMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, chat_id, sender_id, text, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data ?? []) as DBMessage[];
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string
) {
  const { error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: senderId, text });
  if (error) throw error;
  await supabase
    .from('chats')
    .update({
      last_message: text,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', chatId);
}

// ────────────────────────────────────────────────
// COMMENTS
// ────────────────────────────────────────────────

export type DBComment = {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  profiles: Pick<DBProfile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
};

export async function getPost(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', postId)
    .single();
  if (error || !data) return null;
  return mapPost(data as unknown as DBPost);
}

export async function getComments(postId: string): Promise<DBComment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, post_id, user_id, text, created_at, profiles(id, username, display_name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as unknown as DBComment[];
}

export async function addComment(
  postId: string,
  userId: string,
  text: string
): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, text });
  if (error) throw error;
}

// ────────────────────────────────────────────────
// PROFILE UPDATE
// ────────────────────────────────────────────────

export async function updateRelationshipStatus(
  userId: string,
  status: string | null
): Promise<void> {
  await supabase
    .from('profiles')
    .update({ relationship_status: status })
    .eq('id', userId);
}

// ────────────────────────────────────────────────
// DISCOVER SEARCH
// ────────────────────────────────────────────────

export async function searchPostsByPlace(
  query: string
): Promise<Array<{ place_name: string; lat: number; lng: number; count: number }>> {
  const { data } = await supabase
    .from('posts')
    .select('place_name, lat, lng')
    .gt('expires_at', new Date().toISOString())
    .ilike('place_name', `%${query}%`)
    .limit(20);
  if (!data || data.length === 0) return [];
  const map = new Map<string, { lat: number; lng: number; count: number }>();
  for (const row of data as any[]) {
    const key = row.place_name as string;
    if (map.has(key)) map.get(key)!.count++;
    else map.set(key, { lat: row.lat, lng: row.lng, count: 1 });
  }
  return Array.from(map.entries()).map(([place_name, v]) => ({ place_name, ...v }));
}

// ────────────────────────────────────────────────
// USER SEARCH
// ────────────────────────────────────────────────

export type DBUserResult = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number;
};

export async function searchUsers(query: string): Promise<DBUserResult[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, follower_count')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20);
  return (data ?? []) as DBUserResult[];
}

export async function getChatCreatedAt(chatId: string): Promise<number> {
  const { data } = await supabase
    .from('chats')
    .select('created_at')
    .eq('id', chatId)
    .single();
  return data ? new Date(data.created_at).getTime() : Date.now();
}

// ────────────────────────────────────────────────
// LIKES
// ────────────────────────────────────────────────

export async function hasLiked(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('post_likes')
    .select('user_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

export async function likePost(postId: string, userId: string): Promise<void> {
  await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
}

// ────────────────────────────────────────────────
// PUSH TOKENS
// ────────────────────────────────────────────────

export async function savePushToken(
  userId: string,
  token: string,
  platform: string
) {
  await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token, platform }, { onConflict: 'user_id,token' });
}
