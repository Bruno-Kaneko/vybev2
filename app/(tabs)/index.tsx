import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Animated,
  Share as NativeShare,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Bell, Heart, MapPin, MessageCircle, MoreHorizontal, Send } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_POSTS } from '@/constants/MockData';
import { Avatar, PostTimer } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import type { Post } from '@/types';

export default function HomeScreen() {
  const responsive = useResponsive();

  return (
    <View style={styles.root}>
      <FlatList
        data={MOCK_POSTS}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.feedContent,
          {
            paddingHorizontal: responsive.isPhone ? 0 : responsive.pagePadding,
            paddingBottom: 110,
          },
        ]}
        ListHeaderComponent={<HomeHeader maxWidth={responsive.feedMaxWidth} />}
        renderItem={({ item }) => (
          <PostCard post={item} maxWidth={responsive.feedMaxWidth} isPhone={responsive.isPhone} />
        )}
      />
    </View>
  );
}

function HomeHeader({ maxWidth }: { maxWidth: number }) {
  return (
    <View style={[styles.header, { maxWidth }]}>
      <Text style={styles.logo}>VYBE</Text>
      <TouchableOpacity style={styles.iconButton} activeOpacity={0.78}>
        <Bell color={Colors.white} size={21} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

function PostCard({ post, maxWidth, isPhone }: { post: Post; maxWidth: number; isPhone: boolean }) {
  const [liked, setLiked] = useState(false);
  const [shared, setShared] = useState(false);
  const likeScale = useState(new Animated.Value(1))[0];

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.24, useNativeDriver: true, damping: 5, stiffness: 380 } as any),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 260 } as any),
    ]).start();
    setLiked(prev => !prev);
  };

  const handleShare = async () => {
    Haptics.selectionAsync();
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

  const likeCount = post.reactions.heart + (liked ? 1 : 0);

  return (
    <View style={[styles.postCard, { maxWidth }, isPhone && styles.postCardPhone]}>
      <View style={styles.postHeader}>
        <TouchableOpacity
          style={styles.authorRow}
          onPress={() => router.push(`/profile/${post.userId}`)}
          activeOpacity={0.85}
        >
          <Avatar uri={post.user.avatar} size="sm" withGradientBorder />
          <View style={styles.authorText}>
            <View style={styles.authorLine}>
              <Text style={styles.displayName} numberOfLines={1}>{post.user.displayName}</Text>
              <View style={styles.locationInline}>
                <MapPin color={Colors.secondary} size={13} strokeWidth={2.4} />
                <Text style={styles.locationText} numberOfLines={1}>{post.placeName}</Text>
              </View>
            </View>
            <Text style={styles.username}>@{post.user.username}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <PostTimer expiresAt={post.expiresAt} compact />
          <TouchableOpacity style={styles.moreButton} activeOpacity={0.75}>
            <MoreHorizontal color={Colors.textMuted} size={22} strokeWidth={2.1} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={handleLike} activeOpacity={0.95}>
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <View style={styles.primaryActions}>
          <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton} activeOpacity={0.75}>
              <Heart
                color={liked ? Colors.secondary : Colors.white}
                fill={liked ? Colors.secondary : 'transparent'}
                size={25}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
            style={styles.actionButton}
            activeOpacity={0.75}
          >
            <MessageCircle color={Colors.white} size={25} strokeWidth={2.1} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionButton} activeOpacity={0.75}>
            <Send color={shared ? Colors.secondary : Colors.white} size={24} strokeWidth={2.1} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.postMeta}>
        <Text style={styles.likes}>{likeCount} curtidas</Text>
        <Text style={styles.caption}>
          <Text style={styles.captionUser}>{post.user.username} </Text>
          {post.caption}
        </Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}>
          <Text style={styles.comments}>Ver todos os {post.commentCount} comentarios</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  feedContent: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.md,
  },
  logo: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
    letterSpacing: 4,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  postCard: {
    width: '100%',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  postCardPhone: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderRadius: 0,
  },
  postHeader: {
    minHeight: 62,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  authorRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  authorText: {
    flex: 1,
    minWidth: 0,
  },
  authorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 0,
  },
  displayName: {
    flexShrink: 1,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  locationInline: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    flexShrink: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  username: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDim,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  moreButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: Colors.surface,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  primaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 42,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postMeta: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  likes: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  caption: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: FontSize.sm * 1.45,
  },
  captionUser: {
    fontFamily: FontFamily.bodySemiBold,
    color: Colors.white,
  },
  comments: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
