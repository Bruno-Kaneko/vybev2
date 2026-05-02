import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, UserCheck } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { getFollowers, getFollowing, getFollowingIds, followUser, unfollowUser } from '@/lib/db';
import type { DBUserResult } from '@/lib/db';
import { Avatar } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';

export default function FollowersScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { user: authUser } = useAuth();
  const isFollowers = type !== 'following';
  const [users, setUsers] = useState<DBUserResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loadingFollow, setLoadingFollow] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [list, ids] = await Promise.all([
        isFollowers ? getFollowers(id) : getFollowing(id),
        authUser ? getFollowingIds(authUser.id) : Promise.resolve(new Set<string>()),
      ]);
      setUsers(list);
      setFollowingIds(ids);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [id, isFollowers, authUser?.id]);

  useEffect(() => { load(); }, [load]);

  const handleFollow = async (targetId: string) => {
    if (!authUser || targetId === authUser.id) return;
    setLoadingFollow(prev => new Set([...prev, targetId]));
    try {
      if (followingIds.has(targetId)) {
        await unfollowUser(authUser.id, targetId);
        setFollowingIds(prev => { const s = new Set(prev); s.delete(targetId); return s; });
      } else {
        await followUser(authUser.id, targetId);
        setFollowingIds(prev => new Set([...prev, targetId]));
      }
    } catch {} finally {
      setLoadingFollow(prev => { const s = new Set(prev); s.delete(targetId); return s; });
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: responsive.pagePadding }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={Colors.textMuted} size={22} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.title}>{isFollowers ? 'Seguidores' : 'Seguindo'}</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.secondary} size="large" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: responsive.pagePadding, paddingBottom: insets.bottom + 40 },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <UserCheck color={Colors.textMuted} size={48} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>
                {isFollowers ? 'Nenhum seguidor ainda' : 'Não segue ninguém ainda'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.id === authUser?.id;
            const following = followingIds.has(item.id);
            const busy = loadingFollow.has(item.id);
            return (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.8}
                onPress={() => router.push(`/profile/${item.id}`)}
              >
                <Avatar uri={item.avatar_url ?? ''} size="md" />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{item.display_name ?? item.username}</Text>
                  <Text style={styles.handle} numberOfLines={1}>@{item.username}</Text>
                </View>
                {!isMe && (
                  <TouchableOpacity
                    style={[styles.followBtn, following && styles.followBtnOutline]}
                    onPress={() => handleFollow(item.id)}
                    disabled={busy}
                    activeOpacity={0.8}
                  >
                    {busy ? (
                      <ActivityIndicator color={following ? Colors.white : Colors.secondary} size="small" />
                    ) : (
                      <Text style={[styles.followBtnText, following && styles.followBtnTextOutline]}>
                        {following ? 'Seguindo' : 'Seguir'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  handle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  followBtn: {
    height: 34,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 86,
    flexShrink: 0,
  },
  followBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  followBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  followBtnTextOutline: {
    color: Colors.textMuted,
  },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyTitle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
