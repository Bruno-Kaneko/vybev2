import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share as NativeShare } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, MapPin, MessageCircle, Send } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_POSTS } from '@/constants/MockData';
import { Avatar, PostTimer } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const post = MOCK_POSTS.find(p => p.id === id) ?? MOCK_POSTS[0];
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);

  const sharePost = async () => {
    setShared(true);
    try {
      await NativeShare.share({
        title: 'VYBE',
        message: `${post.user.displayName} esta em ${post.placeName}: ${post.caption}`,
      });
    } catch {
      setShared(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={[styles.shell, { maxWidth: responsive.feedMaxWidth }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={Colors.white} size={24} strokeWidth={2.4} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>

        <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,15,0.76)']}
          style={styles.imageOverlay}
        />

        <View style={styles.info}>
          <View style={styles.userRow}>
            <TouchableOpacity
              style={styles.userLeft}
              onPress={() => router.push(`/profile/${post.userId}`)}
              activeOpacity={0.85}
            >
              <Avatar uri={post.user.avatar} size="sm" withGradientBorder />
              <View style={styles.userCopy}>
                <View style={styles.nameLine}>
                  <Text style={styles.username}>{post.user.displayName}</Text>
                  <View style={styles.placeLine}>
                    <MapPin color={Colors.secondary} size={13} strokeWidth={2.4} />
                    <Text style={styles.placeName} numberOfLines={1}>{post.placeName}</Text>
                  </View>
                </View>
                <Text style={styles.handle}>@{post.user.username}</Text>
              </View>
            </TouchableOpacity>
            <PostTimer expiresAt={post.expiresAt} />
          </View>

          <Text style={styles.caption}>{post.caption}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={() => setLiked(prev => !prev)} style={styles.actionBtn}>
              <Heart
                color={liked ? Colors.secondary : Colors.white}
                fill={liked ? Colors.secondary : 'transparent'}
                size={24}
                strokeWidth={2.2}
              />
              <Text style={styles.actionLabel}>{post.reactions.heart + (liked ? 1 : 0)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <MessageCircle color={Colors.white} size={24} strokeWidth={2.2} />
              <Text style={styles.actionLabel}>{post.commentCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sharePost} style={styles.actionBtn}>
              <Send color={shared ? Colors.secondary : Colors.white} size={23} strokeWidth={2.2} />
              <Text style={styles.actionLabel}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  shell: {
    flex: 1,
    width: '100%',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: Colors.surface,
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 190,
  },
  info: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  userLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  userCopy: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 0,
  },
  username: {
    flexShrink: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  placeLine: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  placeName: {
    flexShrink: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  handle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDim,
    marginTop: 2,
  },
  caption: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.white,
    lineHeight: FontSize.md * 1.45,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 40,
  },
  actionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
});
