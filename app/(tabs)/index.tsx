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
import { ArrowUp, Bell, Heart, LogOut, MapPin, MessageCircle, Send, Timer, Users, X } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_POSTS, MOCK_CHATS } from '@/constants/MockData';
import { Avatar, BrandLogo, PostTimer } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import type { Post, Chat } from '@/types';

export default function HomeScreen() {
  const responsive = useResponsive();
  const insets = useSafeAreaInsets();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [grupoesOpen, setGrupoesOpen] = useState(false);
  const [joinedGroup, setJoinedGroup] = useState<{ id: string; name: string } | null>(null);
  const [groupChatOpen, setGroupChatOpen] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);

  const handleJoin = (g: { id: string; name: string }) => {
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
            onNotifPress={() => setNotifOpen(true)}
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
      <NotificationsDrawer
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        insets={insets}
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

function HomeHeader({ maxWidth, onMessagesPress, onGrupoesPress, onNotifPress }: {
  maxWidth: number;
  onMessagesPress: () => void;
  onGrupoesPress: () => void;
  onNotifPress: () => void;
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
        <Animated.View style={[styles.drawerSheet, { height: heightAnim, paddingBottom: insets.bottom + Spacing.xl, transform: [{ translateY: slideAnim }] }]}>
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

const MOCK_NOTIFS = [
  { id: 'n1', type: 'like', user: 'Ana Lima', text: 'curtiu seu post', time: Date.now() - 3 * 60000, link: '/post/p1' },
  { id: 'n2', type: 'follow', user: 'Pedro S.', text: 'começou a te seguir', time: Date.now() - 12 * 60000, link: '/profile/u2' },
  { id: 'n3', type: 'like', user: 'Julia M.', text: 'curtiu seu post', time: Date.now() - 28 * 60000, link: '/post/p2' },
  { id: 'n4', type: 'follow', user: 'Caio R.', text: 'começou a te seguir', time: Date.now() - 60 * 60000, link: '/profile/u4' },
  { id: 'n5', type: 'like', user: 'Bianca T.', text: 'e mais 4 pessoas curtiram seu post', time: Date.now() - 2 * 60 * 60000, link: '/post/p1' },
];

function NotificationsDrawer({
  visible,
  onClose,
  insets,
}: {
  visible: boolean;
  onClose: () => void;
  insets: { bottom: number; top: number };
}) {
  const { height: SCREEN_H } = useWindowDimensions();
  const SNAP_HALF = Math.min(380, SCREEN_H * 0.55);
  const heightAnim = useRef(new Animated.Value(SNAP_HALF)).current;
  const currentH = useRef(SNAP_HALF);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const notifs = useMemo(() => MOCK_NOTIFS.filter(n => !dismissed.has(n.id)), [dismissed]);

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
        <Animated.View style={[styles.drawerSheet, { height: heightAnim, paddingBottom: insets.bottom + Spacing.xl, transform: [{ translateY: slideAnim }] }]}>
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
            data={notifs}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.notifEmpty}>
                <Text style={styles.notifEmptyText}>Nenhuma notificação</Text>
              </View>
            }
            renderItem={({ item }) => {
              const diff = Date.now() - item.time;
              const mins = Math.floor(diff / 60000);
              const timeStr = mins < 1 ? 'agora' : mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`;
              return (
                <Swipeable
                  renderRightActions={() => (
                    <View style={styles.notifSwipeDelete}>
                      <Text style={styles.notifSwipeDeleteText}>✕</Text>
                    </View>
                  )}
                  onSwipeableOpen={() => setDismissed(prev => new Set([...prev, item.id]))}
                  rightThreshold={60}
                >
                  <TouchableOpacity
                    style={styles.drawerRow}
                    activeOpacity={0.75}
                    onPress={() => {
                      onClose();
                      if (item.link) router.push(item.link as any);
                    }}
                  >
                    <View style={[styles.notifIcon, { backgroundColor: item.type === 'like' ? 'rgba(255,45,120,0.15)' : 'rgba(123,47,255,0.15)' }]}>
                      <Text style={styles.notifEmoji}>{item.type === 'like' ? '❤️' : '👤'}</Text>
                    </View>
                    <View style={styles.drawerRowInfo}>
                      <Text style={styles.drawerRowName} numberOfLines={2}>
                        <Text style={{ color: Colors.white }}>{item.user}</Text>
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
      </View>
    </Modal>
  );
}

const MOCK_GRUPOS = [
  { id: 'g1', name: 'Club Fama Tonight 🔥', members: 312, lastMsg: 'Quem ta chegando agora?', unread: 8 },
  { id: 'g2', name: 'Bar do Victor — Rolê', members: 87, lastMsg: 'Open bar até meia-noite!', unread: 3 },
  { id: 'g3', name: 'D-Edge rave crew', members: 540, lastMsg: 'Lineup confirmado 🎧', unread: 0 },
  { id: 'g4', name: 'Balada SP — Geral', members: 1240, lastMsg: 'Alguém no Outs?', unread: 21 },
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
  joinedGroup: { id: string; name: string } | null;
  cooldownUntil: number | null;
  onJoin: (g: { id: string; name: string }) => void;
  onOpenChat: () => void;
}) {
  const { height: SCREEN_H } = useWindowDimensions();
  const SNAP_HALF = Math.min(400, SCREEN_H * 0.58);
  const heightAnim = useRef(new Animated.Value(SNAP_HALF)).current;
  const currentH = useRef(SNAP_HALF);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [dialog, setDialog] = useState<DialogConfig | null>(null);

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
        <Animated.View style={[styles.drawerSheet, { height: heightAnim, paddingBottom: insets.bottom + Spacing.xl, transform: [{ translateY: slideAnim }] }]}>
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
                if (isJoined) {
                  onOpenChat();
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
                  onConfirm: () => onJoin({ id: item.id, name: item.name }),
                });
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
  group: { id: string; name: string };
  insets: { bottom: number; top: number };
  onClose: () => void;
  onLeave: () => void;
}) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<GroupMessage[]>(MOCK_GROUP_MESSAGES);
  const [leaveDialog, setLeaveDialog] = useState(false);

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

        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gcMessagesList}
          renderItem={({ item }) => <GroupMessageBubble msg={item} />}
        />

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
      </KeyboardAvoidingView>

      {/* Leave confirmation dialog */}
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
    </Modal>
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
