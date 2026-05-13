import { supabase } from './supabase';
import type { Post, User } from '@/types';

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  is_private: boolean;
  last_seen_at: string | null;
  show_online_status: boolean;
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
    isPrivate: p.is_private ?? false,
    lastSeenAt: p.last_seen_at ? new Date(p.last_seen_at).getTime() : null,
    showOnlineStatus: p.show_online_status ?? true,
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
  const [{ data, error }, { count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  if (error || !data) return null;
  const profile = data as DBProfile;
  return mapProfile({
    ...profile,
    follower_count: followerCount ?? profile.follower_count,
    following_count: followingCount ?? profile.following_count,
  });
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
  // Use array+limit instead of maybeSingle — avoids PGRST116 when multiple rows exist for same pair
  const { data: rows } = await supabase
    .from('chats')
    .select('id, created_at')
    .or(
      `and(participant_a.eq.${a},participant_b.eq.${b}),and(participant_a.eq.${b},participant_b.eq.${a})`
    )
    .order('created_at', { ascending: false })
    .limit(1);
  const existing = rows?.[0];
  if (existing) {
    const age = Date.now() - new Date((existing as any).created_at).getTime();
    if (age < 8 * 3600 * 1000) return existing.id as string;
  }

  const { data, error } = await supabase
    .from('chats')
    .insert({ participant_a: a, participant_b: b })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function createFreshChat(myId: string, otherId: string): Promise<string> {
  const [a, b] = [myId, otherId].sort();
  await supabase.from('chats').delete()
    .or(`and(participant_a.eq.${a},participant_b.eq.${b}),and(participant_a.eq.${b},participant_b.eq.${a})`);
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

  // Keep only the most recent chat per other participant (ordered by last_message_at DESC already)
  const seen = new Set<string>();
  const deduped = (data ?? []).filter((chat: any) => {
    const otherId = chat.participant_a === userId ? chat.participant_b : chat.participant_a;
    if (seen.has(otherId)) return false;
    seen.add(otherId);
    return true;
  });
  return deduped as unknown as DBChat[];
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
): Promise<{ id: string; created_at: string }> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: senderId, text })
    .select('id, created_at')
    .single();
  if (error) throw error;
  await supabase
    .from('chats')
    .update({
      last_message: text,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', chatId);
  return { id: data.id as string, created_at: data.created_at as string };
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
// FOLLOW REQUESTS
// ────────────────────────────────────────────────

export type FollowRequestStatus = 'none' | 'pending' | 'following';

export async function getFollowRequestStatus(
  requesterId: string,
  targetId: string
): Promise<FollowRequestStatus> {
  const [{ data: followData }, { data: reqData }] = await Promise.all([
    supabase.from('follows').select('follower_id').eq('follower_id', requesterId).eq('following_id', targetId).maybeSingle(),
    supabase.from('follow_requests').select('id').eq('requester_id', requesterId).eq('target_id', targetId).maybeSingle(),
  ]);
  if (followData) return 'following';
  if (reqData) return 'pending';
  return 'none';
}

export async function sendFollowRequest(requesterId: string, targetId: string): Promise<void> {
  await supabase.from('follow_requests').upsert(
    { requester_id: requesterId, target_id: targetId },
    { onConflict: 'requester_id,target_id', ignoreDuplicates: true }
  );
}

export async function cancelFollowRequest(requesterId: string, targetId: string): Promise<void> {
  await supabase.from('follow_requests').delete().eq('requester_id', requesterId).eq('target_id', targetId);
}

export async function acceptFollowRequest(requesterId: string, targetId: string): Promise<void> {
  await supabase.from('follows').insert({ follower_id: requesterId, following_id: targetId });
  await supabase.from('follow_requests').delete().eq('requester_id', requesterId).eq('target_id', targetId);
}

export async function rejectFollowRequest(requesterId: string, targetId: string): Promise<void> {
  await supabase.from('follow_requests').delete().eq('requester_id', requesterId).eq('target_id', targetId);
}

export async function setProfilePrivacy(userId: string, isPrivate: boolean): Promise<void> {
  await supabase.from('profiles').update({ is_private: isPrivate }).eq('id', userId);
}

export async function updateLastSeen(userId: string): Promise<void> {
  await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', userId);
}

export async function setOnlineStatusVisibility(userId: string, show: boolean): Promise<void> {
  await supabase.from('profiles').update({ show_online_status: show }).eq('id', userId);
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

// ────────────────────────────────────────────────
// NOTIFICATIONS
// ────────────────────────────────────────────────

export type DBNotification = {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'follow' | 'comment' | 'message';
  post_id: string | null;
  text: string;
  read: boolean;
  created_at: string;
  actor: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
};

export const NOTIFICATIONS_TTL_MS = 4 * 60 * 60 * 1000;

export async function getNotifications(userId: string): Promise<DBNotification[]> {
  const cutoff = new Date(Date.now() - NOTIFICATIONS_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, actor_id, type, post_id, text, read, created_at, actor:profiles!actor_id(id, username, display_name, avatar_url)')
    .eq('user_id', userId)
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data as unknown as DBNotification[];
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAllUserNotifications(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
  if (error) throw error;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  if (error) throw error;
}

// ────────────────────────────────────────────────
// FOLLOWERS / FOLLOWING
// ────────────────────────────────────────────────

export async function getFollowers(userId: string): Promise<DBUserResult[]> {
  const { data } = await supabase
    .from('follows')
    .select('follower:profiles!follower_id(id, username, display_name, avatar_url, follower_count)')
    .eq('following_id', userId)
    .limit(200);
  if (!data) return [];
  return (data as any[]).map((row: any) => row.follower).filter(Boolean) as DBUserResult[];
}

export async function getFollowing(userId: string): Promise<DBUserResult[]> {
  const { data } = await supabase
    .from('follows')
    .select('following:profiles!following_id(id, username, display_name, avatar_url, follower_count)')
    .eq('follower_id', userId)
    .limit(200);
  if (!data) return [];
  return (data as any[]).map((row: any) => row.following).filter(Boolean) as DBUserResult[];
}

export async function getFollowingIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
    .limit(1000);
  return new Set((data ?? []).map((r: any) => r.following_id as string));
}

export async function getFollowingFeedPosts(userId: string): Promise<Post[]> {
  const ids = await getFollowingIds(userId);
  if (ids.size === 0) return [];
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .in('user_id', [...ids])
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return (data as unknown as DBPost[]).map(mapPost);
}

// ────────────────────────────────────────────────
// PUSH NOTIFICATIONS
// ────────────────────────────────────────────────

export async function getPushTokens(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);
  return (data ?? []).map((r: any) => r.token as string).filter(Boolean);
}

export async function createNotification(
  userId: string,
  actorId: string,
  type: 'like' | 'follow' | 'comment' | 'message',
  postId: string | null,
  text: string
) {
  await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type,
    post_id: postId,
    text,
    read: false,
  });
}

export async function notifyUser(
  recipientId: string,
  actorId: string,
  type: 'like' | 'follow' | 'comment' | 'message',
  postId: string | null,
  text: string,
  pushTitle: string,
  pushBody: string
) {
  try {
    await createNotification(recipientId, actorId, type, postId, text);
    const tokens = await getPushTokens(recipientId);
    if (!tokens.length) return;
    const messages = tokens
      .filter(t => t.startsWith('ExponentPushToken'))
      .map(token => ({ to: token, title: pushTitle, body: pushBody, sound: 'default', data: { type, postId, userId: actorId } }));
    if (!messages.length) return;
    fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    }).catch(() => {});
  } catch {}
}

// ────────────────────────────────────────────────
// PLACES
// ────────────────────────────────────────────────

export type DBPlace = {
  id: string;
  name: string;
  address: string;
  category: 'club' | 'bar' | 'event' | 'lounge';
  lat: number;
  lng: number;
  neighborhood: string | null;
  description: string | null;
  tags: string[];
  price_level: number | null;
  cover_charge: number | null;
  near_metro: boolean;
  has_parking: boolean;
  has_seating: boolean;
  has_menu: boolean;
  metro_name: string | null;
  metro_distance_m: number | null;
  parking_name: string | null;
  parking_address: string | null;
  follower_count: number;
  crowd_level: string | null;
  queue_level: string | null;
  vibe: string | null;
  crowd_updated_at: string | null;
  created_at: string;
};

export async function getPlace(placeId: string): Promise<DBPlace | null> {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .eq('id', placeId)
    .single();
  if (error || !data) return null;
  return data as DBPlace;
}

export async function getPlaceActivePosts(placeId: string): Promise<Post[]> {
  const { data } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('place_id', placeId)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(30);
  if (!data) return [];
  return (data as unknown as DBPost[]).map(mapPost);
}

export async function submitPlaceReport(
  placeId: string,
  userId: string,
  crowdLevel: string,
  queueLevel: string,
  vibe: string
): Promise<void> {
  await supabase.from('place_reports').insert({
    place_id: placeId,
    user_id: userId,
    crowd_level: crowdLevel,
    queue_level: queueLevel,
    vibe,
  });
}

export async function isFollowingPlace(userId: string, placeId: string): Promise<boolean> {
  const { data } = await supabase
    .from('place_follows')
    .select('place_id')
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .maybeSingle();
  return !!data;
}

export async function followPlace(userId: string, placeId: string): Promise<void> {
  await supabase.from('place_follows').insert({ user_id: userId, place_id: placeId });
}

export async function unfollowPlace(userId: string, placeId: string): Promise<void> {
  await supabase.from('place_follows').delete().eq('user_id', userId).eq('place_id', placeId);
}
