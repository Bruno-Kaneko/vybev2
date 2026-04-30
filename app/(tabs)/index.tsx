import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  PanResponder,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Heart, MapPin, MessageCircle, Send, Users, X } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_POSTS, MOCK_CHATS } from '@/constants/MockData';
import { Avatar, BrandLogo, PostTimer } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import type { Post, Chat } from '@/types';

export default function HomeScreen() {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [grupoesOpen, setGrupoesOpen] = useState(false);
  const [joinedGroup, setJoinedGroup] = useState<{ id: string; name: string } | null>(null);

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
            onGrupoesPress={() => setGrupoesOpen(true)}
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
      <GrupoesDrawer
        visible={grupoesOpen}
        onClose={() => setGrupoesOpen(false)}
        insets={insets}
        joinedGroup={joinedGroup}
        onJoin={g => setJoinedGroup(g)}
      />
    </View>
  );
}

function HomeHeader({ maxWidth, onMessagesPress, onGrupoesPress }: {
  maxWidth: number;
  onMessagesPress: () => void;
  onGrupoesPress: () => void;
}) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.spring(pulseScale, { toValue: 1.32, useNativeDriver: true, damping: 4, stiffness: 200 } as any),
          Animated.timing(ringScale, { toValue: 1.9, duration: 500, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.6, duration: 150, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(pulseScale, { toValue: 1, useNativeDriver: true, damping: 4, stiffness: 200 } as any),
          Animated.timing(ringScale, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={[styles.header, { maxWidth, alignSelf: 'center', width: '100%' }]}>
      <BrandLogo width={118} height={38} />
      <View style={styles.headerActions}>
        <TouchableOpacity style={[styles.iconButton, styles.groupButton]} activeOpacity={0.78} onPress={onGrupoesPress}>
          <Animated.View style={[styles.groupRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
          <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
            <Users color={Colors.secondary} size={18} strokeWidth={2.1} />
          </Animated.View>
        </TouchableOpacity>
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
  const { height: SCREEN_H } = useWindowDimensions();
  const SNAP_HALF = Math.min(348, SCREEN_H * 0.52);
  const SNAP_FULL = SCREEN_H;

  const heightAnim = useRef(new Animated.Value(SNAP_HALF)).current;
  const currentH = useRef(SNAP_HALF);
  const snapHalfRef = useRef(SNAP_HALF);
  const snapFullRef = useRef(SNAP_FULL);

  useEffect(() => {
    snapHalfRef.current = SNAP_HALF;
    snapFullRef.current = SNAP_FULL;
  }, [SNAP_HALF, SNAP_FULL]);

  useEffect(() => {
    if (visible) {
      heightAnim.setValue(snapHalfRef.current);
      currentH.current = snapHalfRef.current;
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        const next = currentH.current - g.dy;
        heightAnim.setValue(Math.max(180, Math.min(snapFullRef.current, next)));
      },
      onPanResponderRelease: (_, g) => {
        const next = currentH.current - g.dy;
        const mid = (snapHalfRef.current + snapFullRef.current) / 2;
        if (g.vy < -0.5 || next > mid) {
          Animated.spring(heightAnim, { toValue: snapFullRef.current, useNativeDriver: false, damping: 18, stiffness: 180 } as any).start();
          currentH.current = snapFullRef.current;
        } else if (g.vy > 0.5 || next < snapHalfRef.current * 0.55) {
          onClose();
          currentH.current = snapHalfRef.current;
        } else {
          Animated.spring(heightAnim, { toValue: snapHalfRef.current, useNativeDriver: false, damping: 18, stiffness: 180 } as any).start();
          currentH.current = snapHalfRef.current;
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.drawerContainer}>
        <TouchableOpacity style={styles.drawerBackdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.drawerSheet, { height: heightAnim, paddingBottom: insets.bottom + Spacing.xl }]}>
          <View {...panResponder.panHandlers} style={styles.drawerHandleArea}>
            <View style={styles.drawerHandle} />
          </View>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Mensagens</Text>
            <TouchableOpacity onPress={onClose} style={styles.drawerClose}>
              <X color={Colors.textMuted} size={20} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_CHATS.slice(0, 3)}
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
        </Animated.View>
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

const MOCK_GRUPOS = [
  { id: 'g1', name: 'Club Fama Tonight 🔥', members: 312, lastMsg: 'Quem ta chegando agora?', unread: 8 },
  { id: 'g2', name: 'Bar do Victor — Rolê', members: 87, lastMsg: 'Open bar até meia-noite!', unread: 3 },
  { id: 'g3', name: 'D-Edge rave crew', members: 540, lastMsg: 'Lineup confirmado 🎧', unread: 0 },
  { id: 'g4', name: 'Balada SP — Geral', members: 1240, lastMsg: 'Alguém no Outs?', unread: 21 },
];

function GrupoesDrawer({
  visible,
  onClose,
  insets,
  joinedGroup,
  onJoin,
}: {
  visible: boolean;
  onClose: () => void;
  insets: { bottom: number; top: number };
  joinedGroup: { id: string; name: string } | null;
  onJoin: (g: { id: string; name: string }) => void;
}) {
  const { height: SCREEN_H } = useWindowDimensions();
  const SNAP_HALF = Math.min(400, SCREEN_H * 0.58);
  const heightAnim = useRef(new Animated.Value(SNAP_HALF)).current;
  const currentH = useRef(SNAP_HALF);

  useEffect(() => {
    if (visible) {
      heightAnim.setValue(SNAP_HALF);
      currentH.current = SNAP_HALF;
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_, g) => {
        heightAnim.setValue(Math.max(180, Math.min(SCREEN_H, currentH.current - g.dy)));
      },
      onPanResponderRelease: (_, g) => {
        const next = currentH.current - g.dy;
        if (g.vy > 0.5 || next < SNAP_HALF * 0.55) {
          onClose();
        } else if (g.vy < -0.5 || next > (SNAP_HALF + SCREEN_H) / 2) {
          Animated.spring(heightAnim, { toValue: SCREEN_H, useNativeDriver: false, damping: 18, stiffness: 180 } as any).start();
          currentH.current = SCREEN_H;
        } else {
          Animated.spring(heightAnim, { toValue: SNAP_HALF, useNativeDriver: false, damping: 18, stiffness: 180 } as any).start();
          currentH.current = SNAP_HALF;
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.drawerContainer}>
        <TouchableOpacity style={styles.drawerBackdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[styles.drawerSheet, { height: heightAnim, paddingBottom: insets.bottom + Spacing.xl }]}>
          <View {...panResponder.panHandlers} style={styles.drawerHandleArea}>
            <View style={styles.drawerHandle} />
          </View>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Grupões</Text>
            <TouchableOpacity onPress={onClose} style={styles.drawerClose}>
              <X color={Colors.textMuted} size={20} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={MOCK_GRUPOS}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isJoined = joinedGroup?.id === item.id;

              const handlePress = () => {
                if (isJoined) return;

                if (joinedGroup !== null) {
                  // Already in another group
                  if (Platform.OS === 'web') {
                    window.alert(`Você precisa sair do "${joinedGroup.name}" para poder entrar nesse grupão.`);
                  } else {
                    require('react-native').Alert.alert(
                      'Você já está em um grupão',
                      `Saia do "${joinedGroup.name}" para entrar em "${item.name}".`,
                      [{ text: 'OK' }]
                    );
                  }
                  return;
                }

                // Ask to join
                if (Platform.OS === 'web') {
                  if (window.confirm(`Deseja entrar no grupão "${item.name}"?`)) {
                    onJoin({ id: item.id, name: item.name });
                  }
                } else {
                  require('react-native').Alert.alert(
                    'Entrar no grupão',
                    `Deseja entrar em "${item.name}"?`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Entrar', onPress: () => onJoin({ id: item.id, name: item.name }) },
                    ]
                  );
                }
              };

              return (
                <TouchableOpacity style={[styles.drawerRow, isJoined && styles.drawerRowJoined]} activeOpacity={0.8} onPress={handlePress}>
                  <View style={[styles.groupAvatar, isJoined && { borderColor: Colors.secondary, borderWidth: 2 }]}>
                    <Users color={isJoined ? Colors.secondary : Colors.textMuted} size={22} strokeWidth={2} />
                  </View>
                  <View style={styles.drawerRowInfo}>
                    <View style={styles.drawerRowTop}>
                      <Text style={[styles.drawerRowName, (item.unread > 0 || isJoined) && { color: Colors.white }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.drawerRowTime}>{item.members} membros</Text>
                    </View>
                    <Text style={[styles.drawerRowPreview, item.unread > 0 && { color: Colors.text }]} numberOfLines={1}>
                      {isJoined ? '✓ Você está neste grupão' : item.lastMsg}
                    </Text>
                  </View>
                  {item.unread > 0 && !isJoined && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
      </View>
    </Modal>
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
    gap: Spacing.xs,
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
  groupButton: {
    borderColor: 'rgba(255,45,120,0.35)',
    backgroundColor: 'rgba(255,45,120,0.08)',
    overflow: 'visible',
  },
  groupRing: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.secondary,
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
    borderWidth: 0,
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
    overflow: 'hidden',
  },
  drawerHandleArea: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing['3xl'],
  },
  drawerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
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
  drawerRowJoined: {
    backgroundColor: 'rgba(255,45,120,0.06)',
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
  groupAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    flexShrink: 0,
  },
  unreadText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: Colors.white,
  },
});
