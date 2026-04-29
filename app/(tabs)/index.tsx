import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Image,
  TouchableOpacity,
  ViewToken,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_POSTS } from '@/constants/MockData';
import { Avatar, PostTimer } from '@/components/ui';
import type { Post } from '@/types';

const { width: W, height: H } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
    []
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={MOCK_POSTS}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <PostCard post={item} isActive={index === activeIndex} insets={insets} />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        snapToInterval={H}
        decelerationRate="fast"
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.topLogo}>VYBE</Text>
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.topBtn}>
            <Text style={styles.topBtnIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function PostCard({ post, isActive, insets }: { post: Post; isActive: boolean; insets: any }) {
  const [reacted, setReacted] = useState({ fire: false, heart: false });
  const fireScale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleReaction = (type: 'fire' | 'heart') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const scale = type === 'fire' ? fireScale : heartScale;
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, damping: 4, stiffness: 400 } as any),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 300 } as any),
    ]).start();
    setReacted(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <View style={[styles.card, { height: H }]}>
      {/* Background photo */}
      <Image source={{ uri: post.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Gradient overlay */}
      <LinearGradient
        colors={['rgba(10,10,15,0.15)', 'transparent', 'rgba(10,10,15,0.9)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.35, 1]}
      />

      {/* Top: user info + timer */}
      <View style={[styles.topInfo, { top: insets.top + 72 }]}>
        <BlurView intensity={20} tint="dark" style={styles.userChip}>
          <TouchableOpacity
            style={styles.userChipInner}
            onPress={() => router.push(`/profile/${post.userId}`)}
            activeOpacity={0.9}
          >
            <Avatar uri={post.user.avatar} size="xs" withGradientBorder />
            <View>
              <Text style={styles.username}>{post.user.username}</Text>
              <Text style={styles.placeName}>📍 {post.placeName}</Text>
            </View>
          </TouchableOpacity>
        </BlurView>
        <PostTimer expiresAt={post.expiresAt} />
      </View>

      {/* Bottom: caption + actions */}
      <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 80 }]}>
        <View style={styles.captionRow}>
          {post.caption ? (
            <Text style={styles.caption}>{post.caption}</Text>
          ) : null}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Animated.View style={{ transform: [{ scale: fireScale }] }}>
            <TouchableOpacity onPress={() => handleReaction('fire')} style={styles.actionBtn}>
              <Text style={styles.actionIcon}>🔥</Text>
              <Text style={[styles.actionCount, reacted.fire && { color: Colors.secondary }]}>
                {post.reactions.fire + (reacted.fire ? 1 : 0)}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <TouchableOpacity onPress={() => handleReaction('heart')} style={styles.actionBtn}>
              <Text style={styles.actionIcon}>❤️</Text>
              <Text style={[styles.actionCount, reacted.heart && { color: Colors.secondary }]}>
                {post.reactions.heart + (reacted.heart ? 1 : 0)}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/(tabs)/chat/${post.userId}`)}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{post.commentCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>↑</Text>
            <Text style={styles.actionCount}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    width: W,
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  topLogo: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
    letterSpacing: 4,
    textShadowColor: Colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  topActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  topBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBtnIcon: {
    fontSize: 18,
  },
  topInfo: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userChip: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  userChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  username: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  placeName: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  captionRow: {
    marginBottom: Spacing.lg,
  },
  caption: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xl,
    alignItems: 'flex-end',
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionCount: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.white,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
