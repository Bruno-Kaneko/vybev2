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
  Modal,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Heart, MapPin, MessageCircle, Send, X } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_POSTS, MOCK_CHATS } from '@/constants/MockData';
import { Avatar, BrandLogo, PostTimer } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import type { Post, Chat } from '@/types';

export default function HomeScreen() {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const [messagesOpen, setMessagesOpen] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
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
        ListHeaderComponent={
          <HomeHeader
            maxWidth={responsive.feedMaxWidth}
            onMessagesPress={() => setMessagesOpen(true)}
          />
        }
        renderItem={({ item }) => (
          <PostCard post={item} maxWidth={responsive.feedMaxWidth} isPhone={responsive.isPhone} />
        )}
      />
      <MessagesDrawer
        visible={messagesOpen}
        onClose={() => setMessagesOpen(false)}
        insets={insets}
      />
    </View>
  );
}

function HomeHeader({ maxWidth, onMessagesPress }: { maxWidth: number; onMessagesPress: () => void }) {
  return (
    <View style={[styles.header, { maxWidth, alignSelf: 'center', width: '100%' }]}>
      <BrandLogo width={118} height={38} />
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.78}>
          <Bell color={Colors.white} size={18} strokeWidth={2.1} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.78} onPress={onMessagesPress}>
          <MessageCircle color={Colors.white} size={18} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MessagesDrawer({
  visible,
  onClose,
  insets,
}: {
  visible: boolean;
  onClose: () => void;
  insets: { bottom: number; top: number };
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.drawerContainer}>
        <TouchableOpacity style={styles.drawerBackdrop} onPress={onClose} activeOpacity={1} />
        <View style={[styles.drawerSheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={styles.drawerHandle} />
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Mensagens</Text>
            <TouchableOpacity onPress={onClose} style={styles.drawerClose}>
              <X color={Colors.textMuted} size={20} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_CHATS}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <DrawerChatRow chat={item} onClose={onClose} />}
            ListEmptyComponent={
              <View style={styles.drawerEmpty}>
                <MessageCircle color={Colors.textMuted} size={40} strokeWidth={1.8} />
                <Text style={styles.drawerEmptyText}>Sem mensagens ainda</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

function DrawerChatRow({ chat, onClose }: { chat: Chat; onClose: () => void }) {
  const other = chat.participants[0];
  const diff = Date.now() - (chat.lastMessageAt ?? 0);
  const mins = Math.floor(diff / 60000);
  const timeStr = mins < 1 ? 'agora' : mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h` : `${Math.floor(mins / 1440)}d`;

  return (
    <TouchableOpacity
      style={styles.drawerRow}
      activeOpacity={0.8}
      onPress={() => {
        onClose();
        router.push(`/(tabs)/chat/${other.id}` as any);
      }}
    >
      <View style={styles.drawerAvatarWrap}>
        <Avatar uri={other.avatar} size="md" />
        {chat.unreadCount > 0 && <View style={styles.drawerDot} />}
      </View>
      <View style={styles.drawerRowInfo}>
        <View style={styles.drawerRowTop}>
          <Text style={[styles.drawerRowName, chat.unreadCount > 0 && { color: Colors.white }]}>
            {other.displayName}
          </Text>
          <Text style={styles.drawerRowTime}>{timeStr}</Text>
        </View>
        <Text
          style={[styles.drawerRowPreview, chat.unreadCount > 0 && { color: Colors.text }]}
          numberOfLines={1}
        >
          {chat.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
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
    <View style={[
      styles.postCard,
      isPhone ? styles.postCardPhone : { maxWidth, alignSelf: 'center', width: '100%' },
    ]}>
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
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <PostTimer expiresAt={post.expiresAt} compact />
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
                size={20}
                strokeWidth={2.2}
              />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
            style={styles.actionButton}
            activeOpacity={0.75}
          >
            <MessageCircle color={Colors.white} size={20} strokeWidth={2.1} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionButton} activeOpacity={0.75}>
            <Send color={shared ? Colors.secondary : Colors.white} size={19} strokeWidth={2.1} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.postMeta}>
        <Text style={styles.likes}>{likeCount} curtidas</Text>
        <Text style={styles.caption} numberOfLines={1}>
          <Text style={styles.captionUser}>{post.user.displayName} </Text>
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
    gap: Spacing.lg,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    height: 58,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  postImage: {
    width: '100%',
    aspectRatio: 1,
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
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postMeta: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
    minHeight: 92,
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
  // Messages drawer
  drawerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  drawerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    paddingTop: Spacing.sm,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['2xl'],
    color: Colors.white,
  },
  drawerClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerAvatarWrap: {
    position: 'relative',
  },
  drawerDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  drawerRowInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  drawerRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  drawerRowName: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  drawerRowTime: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
  },
  drawerRowPreview: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textDisabled,
  },
  drawerEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  drawerEmptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
});
