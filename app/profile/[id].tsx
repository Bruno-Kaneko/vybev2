import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Grid3X3, MapPin, MessageCircle } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_USERS, MOCK_POSTS } from '@/constants/MockData';
import { Avatar, VybeButton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const user = MOCK_USERS.find(u => u.id === id) ?? MOCK_USERS[0];
  const userPosts = MOCK_POSTS.filter(p => p.userId === user.id);
  const contentWidth = Math.min(responsive.contentMaxWidth, responsive.width - responsive.pagePadding * 2);
  const thumbGap = Spacing.xs;
  const thumbSize = (contentWidth - thumbGap * 2) / 3;

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: responsive.pagePadding,
          paddingBottom: insets.bottom + 100,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.shell, { maxWidth: responsive.contentMaxWidth }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={Colors.textMuted} size={22} strokeWidth={2.4} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <Avatar uri={user.avatar} size="xl" withGradientBorder />
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        </View>

        <View style={styles.statsRow}>
          <StatItem label="Seguidores" value={user.followers} />
          <View style={styles.statDivider} />
          <StatItem label="Seguindo" value={user.following} />
          <View style={styles.statDivider} />
          <StatItem label="Pontos" value={user.points} highlight />
        </View>

        <View style={styles.actionsRow}>
          <VybeButton label="Seguir" onPress={() => {}} style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/chat/${user.id}`)}
            style={styles.msgBtn}
          >
            <MessageCircle color={Colors.text} size={19} strokeWidth={2.2} />
            <Text style={styles.msgBtnText}>Mensagem</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.postsSection}>
          <View style={styles.postsHeader}>
            <Grid3X3 color={Colors.white} size={18} strokeWidth={2.2} />
            <Text style={styles.sectionTitle}>Posts</Text>
          </View>
          <View style={[styles.postsGrid, { gap: thumbGap }]}>
            {userPosts.map(post => (
              <TouchableOpacity
                key={post.id}
                style={[styles.postThumb, { width: thumbSize, height: thumbSize * 1.28 }]}
                onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
                activeOpacity={0.85}
              >
                <Image source={{ uri: post.imageUrl }} style={styles.postThumbImg} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(10,10,15,0.7)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.thumbMeta}>
                  <MapPin color={Colors.textMuted} size={11} strokeWidth={2.2} />
                  <Text style={styles.postThumbTimer} numberOfLines={1}>{post.placeName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
  content: {
    alignItems: 'center',
  },
  shell: {
    width: '100%',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  hero: {
    alignItems: 'center',
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
    borderRadius: Radius.lg,
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
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  msgBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  postsSection: {
    width: '100%',
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  postThumb: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  postThumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbMeta: {
    position: 'absolute',
    left: 5,
    right: 5,
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  postThumbTimer: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.textMuted,
  },
});
