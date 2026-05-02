import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, UserCheck } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { getFollowers, getFollowing, getFollowingIds, followUser, unfollowUser } from '@/lib/db';
import type { DBUserResult } from '@/lib/db';
import { Avatar, Skeleton } from '@/components/ui';
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
  const [refreshing, setRefreshing] = useState(false);
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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleFollow = async (targetId: string, targetName: string) => {
    if (!authUser || targetId === authUser.id) return;

    if (followingIds.has(targetId)) {
      Alert.alert(
        'Deixar de seguir?',
        `Você vai deixar de seguir ${targetName}.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Deixar de seguir',
            style: 'destructive',
            onPress: async () => {
              setLoadingFollow(prev => new Set([...prev, targetId]));
              try {
                await unfollowUser(authUser.id, targetId);
                setFollowingIds(prev => { const s = new Set(prev); s.delete(targetId); return s; });
              } catch {} finally {
                setLoadingFollow(prev => { const s = new Set(prev); s.delete(targetId); return s; });
              }
            },
          },
        ]
      );
      return;
    }

    setLoadingFollow(prev => new Set([...prev, targetId]));
    try {
      await followUser(authUser.id, targetId);
      setFollowingIds(prev => new Set([...prev, targetId]));
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
        <View style={[styles.skeletonList, { paddingHorizontal: responsive.pagePadding }]}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={46} height={46} borderRadius={23} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="55%" height={13} borderRadius={6} />
              </View>
              <Skeleton width={80} height={32} borderRadius={16} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.secondary}
              colors={[Colors.secondary]}
            />
          }
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
            const hasRealName = item.display_name && item.display_name !== item.username;
            const displayLabel = hasRealName ? item.display_name! : `@${item.username}`;
            const showHandle = hasRealName;

            return (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.8}
                onPress={() => router.push(`/profile/${item.id}`)}
              >
                <Avatar uri={item.avatar_url ?? ''} size="md" />
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>{displayLabel}</Text>
                  {showHandle && (
                    <Text style={styles.handle} numberOfLines={1}>@{item.username}</Text>
                  )}
                </View>
                {!isMe && (
                  <TouchableOpacity
                    style={[styles.followBtn, following && styles.followBtnOutline]}
                    onPress={() => handleFollow(item.id, displayLabel)}
                    disabled={busy}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.followBtnText, following && styles.followBtnTextOutline]}>
                      {busy ? '...' : following ? 'Seguindo' : 'Seguir'}
                    </Text>
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
  skeletonList: {
    paddingTop: Spacing.md,
    gap: 0,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
