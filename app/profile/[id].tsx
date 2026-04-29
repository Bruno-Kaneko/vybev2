import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_USERS, MOCK_POSTS } from '@/constants/MockData';
import { Avatar, VybeButton } from '@/components/ui';

const { width: W } = Dimensions.get('window');
const THUMB_SIZE = (W - Spacing.xl * 2 - Spacing.sm * 2) / 3;

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const user = MOCK_USERS.find(u => u.id === id) ?? MOCK_USERS[0];
  const userPosts = MOCK_POSTS.filter(p => p.userId === user.id);

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <Avatar uri={user.avatar} size="xl" withGradientBorder />
        <Text style={styles.displayName}>{user.displayName}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatItem label="Posts" value={userPosts.length} />
        <View style={styles.statDivider} />
        <StatItem label="Seguidores" value={user.followers} />
        <View style={styles.statDivider} />
        <StatItem label="Seguindo" value={user.following} />
        <View style={styles.statDivider} />
        <StatItem label="Pontos" value={user.points} highlight />
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <VybeButton label="Seguir" onPress={() => {}} style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/chat/${user.id}`)}
          style={styles.msgBtn}
        >
          <Text style={styles.msgBtnText}>💬 Mensagem</Text>
        </TouchableOpacity>
      </View>

      {/* Posts grid */}
      <View style={styles.postsSection}>
        <Text style={styles.sectionTitle}>Posts</Text>
        <View style={styles.postsGrid}>
          {MOCK_POSTS.map(post => (
            <TouchableOpacity
              key={post.id}
              style={styles.postThumb}
              onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
              activeOpacity={0.85}
            >
              <Image source={{ uri: post.imageUrl }} style={styles.postThumbImg} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(10,10,15,0.7)']}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.postThumbTimer}>⏱ {post.placeName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, highlight && { color: Colors.gold }]}>
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.textMuted,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['2xl'],
    gap: Spacing.xs,
  },
  displayName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['2xl'],
    color: Colors.white,
    marginTop: Spacing.md,
  },
  username: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  bio: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: FontSize.md * 1.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  statLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  msgBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  postsSection: {
    paddingHorizontal: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  postThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * 1.3,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  postThumbImg: {
    width: '100%',
    height: '100%',
  },
  postThumbTimer: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    fontFamily: FontFamily.body,
    fontSize: 8,
    color: Colors.textMuted,
  },
});
