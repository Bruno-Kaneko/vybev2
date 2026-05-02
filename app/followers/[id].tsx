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
import { getFollowers, getFollowing } from '@/lib/db';
import type { DBUserResult } from '@/lib/db';
import { Avatar } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';

export default function FollowersScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const isFollowers = type !== 'following';
  const [users, setUsers] = useState<DBUserResult[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const list = isFollowers ? await getFollowers(id) : await getFollowing(id);
      setUsers(list);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [id, isFollowers]);

  useEffect(() => { load(); }, [load]);

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
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.8}
              onPress={() => router.push(`/profile/${item.id}`)}
            >
              <Avatar uri={item.avatar_url ?? ''} size="md" />
              <View style={styles.info}>
                <Text style={styles.name}>{item.display_name ?? item.username}</Text>
                <Text style={styles.handle}>@{item.username}</Text>
              </View>
              <View style={styles.followersCount}>
                <Text style={styles.followersNum}>
                  {item.follower_count >= 1000
                    ? `${(item.follower_count / 1000).toFixed(1)}k`
                    : item.follower_count}
                </Text>
                <Text style={styles.followersLabel}>seguidores</Text>
              </View>
            </TouchableOpacity>
          )}
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
    marginBottom: Spacing.sm,
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
  followersCount: {
    alignItems: 'flex-end',
    gap: 1,
  },
  followersNum: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  followersLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
