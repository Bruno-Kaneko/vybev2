import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  Easing,
  Share as NativeShare,
  Modal,
  Platform,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp, Bell, Check, Heart, Link, LogOut, MapPin, MessageCircle, Send, Share2, Timer, Users, X } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_CHATS } from '@/constants/MockData';
import { getFeedPosts, hasLiked, likePost, unlikePost, getNotifications, getChats } from '@/lib/db';
import type { DBNotification, DBChat } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { Avatar, BrandLogo, PostTimer } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import * as Location from 'expo-location';
import type { Post } from '@/types';

const MAX_JOIN_RADIUS_KM = 0.5;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isVenueOpen(openHour: number, closeHour: number): boolean {
  const h = new Date().getHours();
  if (closeHour <= openHour) return h >= openHour || h < closeHour;
  return h >= openHour && h < closeHour;
}

function getClosesAtTs(closeHour: number): number {
  const closes = new Date();
  closes.setHours(closeHour, 0, 0, 0);
  if (closes.getTime() <= Date.now()) closes.setDate(closes.getDate() + 1);
  return closes.getTime();
}

export default function HomeScreen() {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [grupoesOpen, setGrupoesOpen] = useState(false);
  const [joinedGroup, setJoinedGroup] = useState<{ id: string; name: string; closesAtTs: number } | null>(null);
  const [groupChatOpen, setGroupChatOpen] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [activePosts, setActivePosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notifs, setNotifs] = useState<DBNotification[]>([]);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<Set<string>>(new Set());
  const [realChats, setRealChats] = useState<DBChat[]>([]);

  const loadFeed = useCallback(async () => {
    try {
      const real = await getFeedPosts();
      setActivePosts(real);
    } catch {
      setActivePosts([]);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 60_000);
    return () => clearInterval(interval);
  }, [loadFeed]);

  const { user: authUserHome } = useAuth();
  useEffect(() => {
    if (!authUserHome) return;
    getNotifications(authUserHome.id).then(setNotifs).catch(() => {});
    getChats(authUserHome.id).then(setRealChats).catch(() => {});
  }, [authUserHome?.id]);

  const handleJoin = (g: { id: string; name: string; closesAtTs: number }) => {
    setJoinedGroup(g);
  };

  const handleLeave = () => {
    setJoinedGroup(null);
    setGroupChatOpen(false);
    setCooldownUntil(Date.now() + 5 * 60 * 1000);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        data={activePosts}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        windowSize={5}
        maxToRenderPerBatch={4}
        initialNumToRender={3}
        refreshing={refreshing}
        onRefresh={handleRefresh}
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
            onNotifPress={() => setNotifOpen(true)}
            notifCount={notifs.filter(n => !n.read && !dismissedNotifIds.has(n.id)).length}
          />
        }
        renderItem={({ item }) => (
          <PostCard post={item} maxWidth={responsive.feedMaxWidth} isPhone={responsive.isPhone} />
        )}
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.feedEmpty}>
              <Text style={styles.feedEmptyTitle}>Tá quieto por aqui...</Text>
              <Text style={styles.feedEmptySub}>Seja o primeiro a postar onde você está!</Text>
            </View>
          ) : null
        }
      />
      <MessagesDrawer
        visible={messagesOpen}
        onClose={() => setMessagesOpen(false)}
        insets={insets}
        chats={realChats}
      />
      <NotificationsDrawer
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        insets={insets}
        notifs={notifs}
        dismissedIds={dismissedNotifIds}
        onDismiss={(id) => setDismissedNotifIds(prev => new Set([...prev, id]))}
      />
      <GrupoesDrawer
        visible={grupoesOpen}
        onClose={() => setGrupoesOpen(false)}
        insets={insets}
        joinedGroup={joinedGroup}
        cooldownUntil={cooldownUntil}
        onJoin={handleJoin}
        onOpenChat={() => { setGrupoesOpen(false); setGroupChatOpen(true); }}
      />
      {joinedGroup && (
        <GroupChatModal
          visible={groupChatOpen}
          group={joinedGroup}
          insets={insets}
          onClose={() => setGroupChatOpen(false)}
          onLeave={handleLeave}
        />
      )}
    </View>
  );
}

function HomeHeader({ maxWidth, onMessagesPress, onGrupoesPress, onNotifPress, notifCount }: {
  maxWidth: number;
  onMessagesPress: () => void;
  onGrupoesPress: () => void;
  onNotifPress: () => void;
  notifCount: number;
}) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(400),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const ringScale = pulseAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1.65, 1.8] });
  const ringOpacity = pulseAnim.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 0.55, 0.35, 0] });

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
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.78} onPress={onNotifPress}>
          <Bell color={Colors.white} size={18} strokeWidth={2.1} />
          {notifCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{notifCount > 9 ? '9+' : notifCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.78} onPress={onMessagesPress}>
          <MessageCircle color={Colors.white} size={18} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function DrawerRealChatRow({ chat, myId, onClose }: { chat: DBChat; myId: string; onClose: () => void }) {
  const iAmA = myId === chat.participant_a;
  const other = iAmA ? chat.profile_b : chat.profile_a;
  const otherId = iAmA ? chat.participant_b : chat.participant_a;
  const diff = chat.last_message_at ? Date.now() - new Date(chat.last_message_at).getTime() : 0;
  const mins = Math.floor(diff / 60000);
  const timeStr = mins < 1 ? 'agora' : mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h` : `${Math.floor(mins / 1440)}d`;
  return (
    <TouchableOpacity
      style={styles.drawerRow}
      activeOpacity={0.8}
      onPress={() => { onClose(); router.push(`/(tabs)/chat/${otherId}` as any); }}
    >
      <Avatar uri={other?.avatar_url ?? ''} size="md" />
      <View style={styles.drawerRowInfo}>
        <View style={styles.drawerRowTop}>
          <Text style={[styles.drawerRowName, { color: Colors.white }]}>{other?.display_name ?? other?.username ?? 'Usuário'}</Text>
          <Text style={styles.drawerRowTime}>{timeStr}</Text>
        </View>
        <Text style={styles.drawerRowPreview} numberOfLines={1}>{chat.last_message ?? ''}</Text>
      </View>
    </TouchableOpacity>
  );
}

function MessagesDrawer({
  visible,
  onClose,
  insets,
  chats,
}: {
  visible: boolean;
  onClose: () => void;
  insets: { bottom: number; top: number };
  chats: DBChat[];
}) {
  const { height: SCREEN_H } = useWindowDimensions();
  const SNAP_HALF = Math.min(348, SCREEN_H * 0.52);
  const SNAP_FULL = SCREEN_H;
  const { user: drawerMe } = useAuth();
  const myId = drawerMe?.id ?? '';

  const heightAnim = useRef(new Animated.Value(SNAP_HALF)).current;
  const currentH = useRef(SNAP_HALF);
  const snapHalfRef = useRef(SNAP_HALF);
  const snapFullRef = useRef(SNAP_FULL);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    snapHalfRef.current = SNAP_HALF;
    snapFullRef.current = SNAP_FULL;
  }, [SNAP_HALF, SNAP_FULL]);

  useEffect(() => {
    if (visible) {
      heightAnim.setValue(snapHalfRef.current);
      currentH.current = snapHalfRef.current;
      slideAnim.setValue(400);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 } as any).start();
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.drawerContainer}>
        <TouchableOpacity style={styles.drawerBackdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
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
            data={chats.slice(0, 3)}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <DrawerRealChatRow chat={item} myId={myId} onClose={onClose} />}
            ListEmptyComponent={
              <View style={styles.drawerEmpty}>
                <MessageCircle color={Colors.textMuted} size={40} strokeWidth={1.8} />
                <Text style={styles.drawerEmptyText}>Sem mensagens ainda</Text>
              </View>
            }
          />
        </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}


function NotificationsDrawer({
  visible,
  onClose,
  insets,
  notifs,
  dismissedIds,
  onDismiss,
}: {
  visible: boolean;
  onClose: () => void;
  insets: { bottom: number; top: number };
  notifs: DBNotification[];
  dismissedIds: Set<string>;
  onDismiss: (id: string) => void;
}) {
  const { height: SCREEN_H } = useWindowDimensions();
  const SNAP_HALF = Math.min(380, SCREEN_H * 0.55);
  const heightAnim = useRef(new Animated.Value(SNAP_HALF)).current;
  const currentH = useRef(SNAP_HALF);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const visibleNotifs = useMemo(() => notifs.filter(n => !dismissedIds.has(n.id)), [notifs, dismissedIds]);

  useEffect(() => {
    if (visible) {
      heightAnim.setValue(SNAP_HALF);
      currentH.current = SNAP_HALF;
      slideAnim.setValue(400);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 } as any).start();
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.drawerContainer}>
        <TouchableOpacity style={styles.drawerBackdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
        <Animated.View style={[styles.drawerSheet, { height: heightAnim, paddingBottom: insets.bottom + Spacing.xl }]}>
          <View {...panResponder.panHandlers} style={styles.drawerHandleArea}>
            <View style={styles.drawerHandle} />
          </View>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Notificações</Text>
            <TouchableOpacity onPress={onClose} style={styles.drawerClose}>
              <X color={Colors.textMuted} size={20} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={visibleNotifs}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.notifEmpty}>
                <Bell color={Colors.textMuted} size={36} strokeWidth={1.8} />
                <Text style={styles.notifEmptyText}>Nenhuma notificação ainda</Text>
              </View>
            }
            renderItem={({ item }) => {
              const diff = Date.now() - new Date(item.created_at).getTime();
              const mins = Math.floor(diff / 60000);
              const timeStr = mins < 1 ? 'agora' : mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
              const actorName = item.actor?.display_name ?? item.actor?.username ?? 'Alguém';
              const link = item.post_id
                ? `/post/${item.post_id}`
                : item.actor_id
                  ? `/profile/${item.actor_id}`
                  : null;
              return (
                <Swipeable
                  renderRightActions={() => (
                    <View style={styles.notifSwipeDelete}>
                      <Text style={styles.notifSwipeDeleteText}>✕</Text>
                    </View>
                  )}
                  onSwipeableOpen={() => onDismiss(item.id)}
                  rightThreshold={60}
                >
                  <TouchableOpacity
                    style={styles.drawerRow}
                    activeOpacity={0.75}
                    onPress={() => { onClose(); if (link) router.push(link as any); }}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: item.type === 'like' ? 'rgba(255,45,120,0.15)' : 'rgba(123,47,255,0.15)' }]}>
                      <Text style={styles.notifEmoji}>{item.type === 'like' ? '❤️' : item.type === 'follow' ? '👤' : item.type === 'comment' ? '💬' : '✉️'}</Text>
                    </View>
                    <View style={styles.drawerRowInfo}>
                      <Text style={styles.drawerRowName} numberOfLines={2}>
                        <Text style={{ color: Colors.white }}>{actorName}</Text>
                        {' '}{item.text}
                      </Text>
                      <Text style={styles.drawerRowTime}>{timeStr}</Text>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              );
            }}
          />
        </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

type GrupoItem = {
  id: string;
  name: string;
  members: number;
  lastMsg: string;
  unread: number;
  location: { latitude: number; longitude: number };
  openHour: number;
  closeHour: number;
};

const MOCK_GRUPOS: GrupoItem[] = [
  { id: 'g1', name: 'Club Fama Tonight 🔥', members: 312, lastMsg: 'Quem ta chegando agora?', unread: 8, location: { latitude: -23.561, longitude: -46.656 }, openHour: 22, closeHour: 5 },
  { id: 'g2', name: 'Bar do Victor — Rolê', members: 87, lastMsg: 'Open bar até meia-noite!', unread: 3, location: { latitude: -23.558, longitude: -46.660 }, openHour: 17, closeHour: 0 },
  { id: 'g3', name: 'D-Edge rave crew', members: 540, lastMsg: 'Lineup confirmado 🎧', unread: 0, location: { latitude: -23.545, longitude: -46.643 }, openHour: 23, closeHour: 6 },
  { id: 'g4', name: 'Balada SP — Geral', members: 1240, lastMsg: 'Alguém no Outs?', unread: 21, location: { latitude: -23.572, longitude: -46.648 }, openHour: 21, closeHour: 4 },
];

type DialogConfig = {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  cancelLabel?: string;
};

function GrupoesDrawer({
  visible,
  onClose,
  insets,
  joinedGroup,
  cooldownUntil,
  onJoin,
  onOpenChat,
}: {
  visible: boolean;
  onClose: () => void;
  insets: { bottom: number; top: number };
  joinedGroup: { id: string; name: string; closesAtTs: number } | null;
  cooldownUntil: number | null;
  onJoin: (g: { id: string; name: string; closesAtTs: number }) => void;
  onOpenChat: () => void;
}) {
  const { height: SCREEN_H } = useWindowDimensions();
  const SNAP_HALF = Math.min(400, SCREEN_H * 0.58);
  const heightAnim = useRef(new Animated.Value(SNAP_HALF)).current;
  const currentH = useRef(SNAP_HALF);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [dialog, setDialog] = useState<DialogConfig | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const nearbyGrupos = userCoords
    ? MOCK_GRUPOS.filter(g => haversineKm(userCoords.latitude, userCoords.longitude, g.location.latitude, g.location.longitude) <= MAX_JOIN_RADIUS_KM)
    : [];

  useEffect(() => {
    if (!visible) return;
    heightAnim.setValue(SNAP_HALF);
    currentH.current = SNAP_HALF;
    slideAnim.setValue(400);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 } as any).start();

    setLocationLoading(true);
    setLocationDenied(false);
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        setLocationDenied(true);
        setLocationLoading(false);
        return;
      }
      return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    }).then(pos => {
      if (pos) setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setLocationLoading(false);
    }).catch(() => {
      setLocationLoading(false);
    });
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
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.drawerContainer}>
        <TouchableOpacity style={styles.drawerBackdrop} onPress={onClose} activeOpacity={1} />
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
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
            data={nearbyGrupos}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              locationLoading ? (
                <View style={styles.drawerEmpty}>
                  <Text style={styles.drawerEmptyText}>Buscando grupões perto de você...</Text>
                </View>
              ) : locationDenied ? (
                <View style={styles.drawerEmpty}>
                  <MapPin color={Colors.textMuted} size={36} strokeWidth={1.8} />
                  <Text style={styles.drawerEmptyText}>Permita o acesso à localização para ver os grupões próximos</Text>
                </View>
              ) : (
                <View style={styles.drawerEmpty}>
                  <Users color={Colors.textMuted} size={36} strokeWidth={1.8} />
                  <Text style={styles.drawerEmptyText}>Nenhum grupão a menos de 500m de você</Text>
                </View>
              )
            }
            renderItem={({ item }) => {
              const isJoined = joinedGroup?.id === item.id;
              const open = isVenueOpen(item.openHour, item.closeHour);

              const handlePress = () => {
                if (isJoined) {
                  onOpenChat();
                  return;
                }

                if (!open) {
                  setDialog({
                    title: 'Grupão fechado',
                    message: `Este grupão só fica ativo a partir das ${item.openHour}h. Volte quando o lugar abrir!`,
                    confirmLabel: 'Entendi',
                  });
                  return;
                }

                if (joinedGroup !== null) {
                  setDialog({
                    title: 'Você já está em um grupão',
                    message: `Saia do "${joinedGroup.name}" para poder entrar em "${item.name}".`,
                    confirmLabel: 'Entendi',
                  });
                  return;
                }

                if (cooldownUntil !== null && Date.now() < cooldownUntil) {
                  const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
                  const mins = Math.floor(remaining / 60);
                  const secs = remaining % 60;
                  const timeStr = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
                  setDialog({
                    title: 'Aguarde um pouco',
                    message: `Você acabou de sair de um grupão. Aguarde ${timeStr} para entrar em outro.`,
                    confirmLabel: 'Entendi',
                  });
                  return;
                }

                setDialog({
                  title: 'Entrar no grupão',
                  message: `Deseja entrar em "${item.name}"?`,
                  confirmLabel: 'Entrar',
                  cancelLabel: 'Cancelar',
                  onConfirm: () => onJoin({ id: item.id, name: item.name, closesAtTs: getClosesAtTs(item.closeHour) }),
                });
              };

              return (
                <TouchableOpacity
                  style={[styles.drawerRow, isJoined && styles.drawerRowJoined, !open && styles.drawerRowClosed]}
                  activeOpacity={0.8}
                  onPress={handlePress}
                >
                  <View style={[styles.groupAvatar, isJoined && { borderColor: Colors.secondary, borderWidth: 2 }, !open && { borderColor: Colors.border }]}>
                    <Users color={isJoined ? Colors.secondary : open ? Colors.textMuted : Colors.textDisabled} size={22} strokeWidth={2} />
                  </View>
                  <View style={styles.drawerRowInfo}>
                    <View style={styles.drawerRowTop}>
                      <Text style={[styles.drawerRowName, (item.unread > 0 || isJoined) && open && { color: Colors.white }, !open && { color: Colors.textDisabled }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {open ? (
                        <Text style={styles.drawerRowTime}>{item.members} membros</Text>
                      ) : (
                        <View style={styles.closedBadge}>
                          <Text style={styles.closedBadgeText}>Fechado</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.drawerRowPreview, item.unread > 0 && open && { color: Colors.text }]} numberOfLines={1}>
                      {isJoined ? '✓ Você está neste grupão' : open ? item.lastMsg : `Abre às ${item.openHour}h`}
                    </Text>
                  </View>
                  {item.unread > 0 && !isJoined && open && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Animated.View>
        </Animated.View>
      </View>

      {/* In-app dialog — rendered outside the drawer sheet so it overlays everything */}
      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => setDialog(null)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>{dialog?.title}</Text>
            <Text style={styles.dialogMessage}>{dialog?.message}</Text>
            <View style={styles.dialogActions}>
              {dialog?.cancelLabel && (
                <TouchableOpacity
                  style={styles.dialogBtnCancel}
                  activeOpacity={0.8}
                  onPress={() => setDialog(null)}
                >
                  <Text style={styles.dialogBtnCancelText}>{dialog.cancelLabel}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.dialogBtnConfirm}
                activeOpacity={0.8}
                onPress={() => {
                  dialog?.onConfirm?.();
                  setDialog(null);
                }}
              >
                <Text style={styles.dialogBtnConfirmText}>{dialog?.confirmLabel ?? 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const MOCK_GROUP_MESSAGES = [
  { id: 'gm1', senderId: 'user1', senderName: 'Ana Lima', text: 'Galera chegando! 🔥', createdAt: Date.now() - 9 * 60000 },
  { id: 'gm2', senderId: 'user2', senderName: 'Pedro S.', text: 'Já to aqui na fila, abriu?', createdAt: Date.now() - 7 * 60000 },
  { id: 'gm3', senderId: 'user3', senderName: 'Julia M.', text: 'Open bar até meia-noite 🍹', createdAt: Date.now() - 5 * 60000 },
  { id: 'gm4', senderId: 'user1', senderName: 'Ana Lima', text: 'Alguém quer dividir o Uber?', createdAt: Date.now() - 3 * 60000 },
  { id: 'gm5', senderId: 'user4', senderName: 'Caio R.', text: 'Lineup confirmado 🎧🎧', createdAt: Date.now() - 1 * 60000 },
];

type GroupMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
};

function GroupChatModal({
  visible,
  group,
  insets,
  onClose,
  onLeave,
}: {
  visible: boolean;
  group: { id: string; name: string; closesAtTs: number };
  insets: { bottom: number; top: number };
  onClose: () => void;
  onLeave: () => void;
}) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<GroupMessage[]>(MOCK_GROUP_MESSAGES);
  const [leaveDialog, setLeaveDialog] = useState(false);
  const [encerrado, setEncerrado] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (Date.now() >= group.closesAtTs) {
      setEncerrado(true);
      setMessages([]);
      return;
    }
    const interval = setInterval(() => {
      if (Date.now() >= group.closesAtTs) {
        setEncerrado(true);
        setMessages([]);
        clearInterval(interval);
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [visible, group.closesAtTs]);

  const send = () => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, {
      id: `gm${Date.now()}`,
      senderId: 'me',
      senderName: 'Eu',
      text: text.trim(),
      createdAt: Date.now(),
    }]);
    setText('');
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
        <KeyboardAvoidingView
          style={[styles.gcRoot, { paddingTop: insets.top }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.gcHeader}>
            <View style={styles.gcHeaderLeft}>
              <Text style={styles.gcSuperLabel}>Grupões</Text>
              <Text style={styles.gcGroupName} numberOfLines={1}>{group.name}</Text>
            </View>
            <View style={styles.gcHeaderRight}>
              <TouchableOpacity onPress={() => setLeaveDialog(true)} style={styles.gcLeaveBtn} activeOpacity={0.8}>
                <LogOut color={Colors.secondary} size={16} strokeWidth={2.2} />
                <Text style={styles.gcLeaveText}>Sair</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.gcCloseBtn} activeOpacity={0.8}>
                <X color={Colors.textMuted} size={20} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>

          {encerrado ? (
            <View style={styles.gcEncerrado}>
              <Timer color={Colors.textMuted} size={40} strokeWidth={1.8} />
              <Text style={styles.gcEncerradoTitle}>Grupão encerrado</Text>
              <Text style={styles.gcEncerradoSub}>O lugar fechou e as mensagens foram apagadas automaticamente.</Text>
              <TouchableOpacity style={styles.gcEncerradoBtn} onPress={onLeave} activeOpacity={0.85}>
                <Text style={styles.gcEncerradoBtnText}>Sair</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.gcMessagesList}
              renderItem={({ item }) => <GroupMessageBubble msg={item} />}
            />
          )}

          {!encerrado && (
            <View style={[styles.gcInputRow, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.gcInputShell}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="Mensagem..."
                  placeholderTextColor={Colors.textDisabled}
                  style={[styles.gcInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  returnKeyType="send"
                  onSubmitEditing={send}
                />
                <TouchableOpacity
                  onPress={send}
                  style={[styles.gcSendBtn, !text.trim() && styles.gcSendBtnDisabled]}
                  disabled={!text.trim()}
                >
                  <ArrowUp color={Colors.white} size={18} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={leaveDialog} transparent animationType="fade" onRequestClose={() => setLeaveDialog(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Sair do grupão?</Text>
            <Text style={styles.dialogMessage}>
              Ao sair, você precisará aguardar 5 minutos antes de entrar em outro grupão.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogBtnCancel}
                activeOpacity={0.8}
                onPress={() => setLeaveDialog(false)}
              >
                <Text style={styles.dialogBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogBtnConfirm, { backgroundColor: Colors.secondary }]}
                activeOpacity={0.8}
                onPress={() => {
                  setLeaveDialog(false);
                  onLeave();
                }}
              >
                <Text style={styles.dialogBtnConfirmText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function GroupMessageBubble({ msg }: { msg: GroupMessage }) {
  const isMe = msg.senderId === 'me';
  return (
    <View style={[styles.gcBubbleWrapper, isMe && styles.gcBubbleWrapperMe]}>
      {!isMe && <Text style={styles.gcSenderName}>{msg.senderName}</Text>}
      <View style={[styles.gcBubble, isMe ? styles.gcBubbleMe : styles.gcBubbleOther]}>
        <Text style={[styles.gcBubbleText, isMe && { color: Colors.white }]}>{msg.text}</Text>
      </View>
    </View>
  );
}

const UUID_RE_FEED = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function PostCard({ post, maxWidth, isPhone }: { post: Post; maxWidth: number; isPhone: boolean }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const likeScale = useState(new Animated.Value(1))[0];
  const sendScale = useState(new Animated.Value(1))[0];
  const isRealPost = UUID_RE_FEED.test(post.id);

  useEffect(() => {
    if (!isRealPost || !user?.id) return;
    hasLiked(post.id, user.id).then(setLiked).catch(() => {});
  }, [post.id, user?.id]);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(likeScale, { toValue: 1.24, useNativeDriver: true, damping: 5, stiffness: 380 } as any),
      Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 260 } as any),
    ]).start();
    const next = !liked;
    setLiked(next);
    if (isRealPost && user?.id) {
      if (next) likePost(post.id, user.id).catch(() => {});
      else unlikePost(post.id, user.id).catch(() => {});
    }
  };

  const handleSharePress = () => {
    Haptics.selectionAsync();
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.82, useNativeDriver: true, damping: 5, stiffness: 400 } as any),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 280 } as any),
    ]).start();
    setShareOpen(true);
  };

  const handleExternalShare = async () => {
    setShareOpen(false);
    await NativeShare.share({
      title: 'VYBE',
      message: `${post.user.displayName} está em ${post.placeName} no VYBE! ${post.caption ?? ''}`.trim(),
    });
  };

  const toggleSend = (chatId: string) => {
    Haptics.selectionAsync();
    setSentTo(prev => {
      const next = new Set(prev);
      next.has(chatId) ? next.delete(chatId) : next.add(chatId);
      return next;
    });
  };

  const likeCount = post.reactions.heart + (liked ? 1 : 0);

  return (
    <View style={[
      styles.postCard,
      isPhone ? styles.postCardPhone : { maxWidth, alignSelf: 'center', width: '100%' },
    ]}>
      <View style={styles.postHeader}>
        <View style={styles.authorRow}>
          <TouchableOpacity
            style={styles.authorAvatarName}
            onPress={() => router.push(`/profile/${post.userId}`)}
            activeOpacity={0.85}
          >
            <Avatar uri={post.user.avatar} size="sm" withGradientBorder />
            <Text style={styles.displayName} numberOfLines={1}>{post.user.displayName}</Text>
          </TouchableOpacity>
          {post.placeId ? (
            <TouchableOpacity
              style={styles.locationInline}
              onPress={() => router.push({ pathname: '/place/[id]', params: { id: post.placeId! } })}
              activeOpacity={0.75}
            >
              <MapPin color={Colors.secondary} size={13} strokeWidth={2.4} />
              <Text style={styles.locationText} numberOfLines={1}>{post.placeName}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.locationInline}>
              <MapPin color={Colors.secondary} size={13} strokeWidth={2.4} />
              <Text style={styles.locationText} numberOfLines={1}>{post.placeName}</Text>
            </View>
          )}
        </View>

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
            onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id, autoComment: '1' } })}
            style={styles.actionButton}
            activeOpacity={0.75}
          >
            <MessageCircle color={Colors.white} size={20} strokeWidth={2.1} />
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity onPress={handleSharePress} style={styles.actionButton} activeOpacity={0.75}>
              <Send color={sentTo.size > 0 ? Colors.secondary : Colors.white} size={19} strokeWidth={2.1} />
            </TouchableOpacity>
          </Animated.View>
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

      <Modal visible={shareOpen} transparent animationType="slide" onRequestClose={() => setShareOpen(false)}>
        <TouchableOpacity style={styles.shareOverlay} activeOpacity={1} onPress={() => setShareOpen(false)} />
        <View style={[styles.shareSheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={styles.shareHandle} />
          <Text style={styles.shareTitle}>Encaminhar</Text>

          <FlatList
            data={MOCK_CHATS}
            keyExtractor={c => c.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shareContacts}
            renderItem={({ item }) => {
              const other = item.participants[0];
              const selected = sentTo.has(item.id);
              return (
                <TouchableOpacity style={styles.shareContact} onPress={() => toggleSend(item.id)} activeOpacity={0.8}>
                  <View style={[styles.shareAvatarWrap, selected && styles.shareAvatarSelected]}>
                    <Avatar uri={other.avatar} size="md" />
                    {selected && (
                      <View style={styles.shareCheckBadge}>
                        <Check color={Colors.white} size={11} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.shareContactName} numberOfLines={1}>{other.displayName.split(' ')[0]}</Text>
                </TouchableOpacity>
              );
            }}
          />

          {sentTo.size > 0 && (
            <TouchableOpacity
              style={styles.shareSendBtn}
              activeOpacity={0.85}
              onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setShareOpen(false); setSentTo(new Set()); }}
            >
              <Send color={Colors.white} size={18} strokeWidth={2.2} />
              <Text style={styles.shareSendText}>Enviar para {sentTo.size} {sentTo.size === 1 ? 'pessoa' : 'pessoas'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.shareActions}>
            <TouchableOpacity style={styles.shareActionBtn} onPress={handleExternalShare} activeOpacity={0.8}>
              <View style={styles.shareActionIcon}>
                <Share2 color={Colors.white} size={20} strokeWidth={2.1} />
              </View>
              <Text style={styles.shareActionLabel}>Compartilhar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareActionBtn} onPress={() => setShareOpen(false)} activeOpacity={0.8}>
              <View style={styles.shareActionIcon}>
                <Link color={Colors.white} size={20} strokeWidth={2.1} />
              </View>
              <Text style={styles.shareActionLabel}>Copiar link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  feedEmpty: {
    paddingTop: 80,
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
  },
  feedEmptyTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.xl,
    color: Colors.white,
    textAlign: 'center',
  },
  feedEmptySub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.55,
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
    overflow: 'visible',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    shadowColor: Colors.primary,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  notifBadgeText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 9,
    color: Colors.white,
    lineHeight: 12,
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
    flexWrap: 'wrap',
  },
  authorAvatarName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 0,
  },
  displayName: {
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
  // Share sheet
  shareOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  shareSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  shareHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  shareTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
    marginBottom: Spacing.xl,
  },
  shareContacts: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  shareContact: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: 64,
  },
  shareAvatarWrap: {
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shareAvatarSelected: {
    borderColor: Colors.secondary,
  },
  shareCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareContactName: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  shareSendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 50,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondary,
    marginBottom: Spacing.lg,
  },
  shareSendText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  shareActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  shareActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  shareActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareActionLabel: {
    fontFamily: FontFamily.bodyMedium,
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
    backgroundColor: 'transparent',
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
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifEmoji: {
    fontSize: 18,
  },
  notifSwipeDelete: {
    width: 72,
    backgroundColor: Colors.urgent,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    marginVertical: 2,
    marginRight: Spacing.md,
  },
  notifSwipeDeleteText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: FontFamily.bodySemiBold,
  },
  notifEmpty: {
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
  },
  notifEmptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  drawerRowClosed: {
    opacity: 0.55,
  },
  closedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closedBadgeText: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.textDisabled,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gcEncerrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    gap: Spacing.md,
  },
  gcEncerradoTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
    textAlign: 'center',
  },
  gcEncerradoSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.55,
  },
  gcEncerradoBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gcEncerradoBtnText: {
    fontFamily: FontFamily.bodyMedium,
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
  // In-app dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing['2xl'],
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  dialogTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  dialogMessage: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    lineHeight: FontSize.md * 1.55,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dialogBtnCancel: {
    flex: 1,
    height: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnCancelText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  dialogBtnConfirm: {
    flex: 1,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  dialogBtnConfirmText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  // GroupChatModal
  gcRoot: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gcHeaderLeft: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  gcSuperLabel: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  gcGroupName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  gcHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gcLeaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,45,120,0.1)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,0.25)',
  },
  gcLeaveText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.secondary,
  },
  gcCloseBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gcMessagesList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  gcBubbleWrapper: {
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  gcBubbleWrapperMe: {
    alignItems: 'flex-end',
  },
  gcSenderName: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginBottom: 3,
    paddingHorizontal: Spacing.sm,
  },
  gcBubble: {
    maxWidth: '72%',
    borderRadius: 22,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  gcBubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 7,
  },
  gcBubbleMe: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 7,
  },
  gcBubbleText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: FontSize.md * 1.5,
  },
  gcInputRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
  },
  gcInputShell: {
    height: 44,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.lg,
    paddingRight: 5,
  },
  gcInput: {
    flex: 1,
    height: '100%',
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  gcSendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  gcSendBtnDisabled: {
    opacity: 0.4,
  },
});
