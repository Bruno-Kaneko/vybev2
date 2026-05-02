import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowUp, ChevronLeft, LockKeyhole, Timer } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_USERS, MOCK_CHATS } from '@/constants/MockData';
import { Avatar } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import { getOrCreateChat, getMessages, sendMessage, getChatCreatedAt } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { DBMessage } from '@/lib/db';

const CHAT_LIFETIME_MS = 8 * 3600 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MsgRow = { id: string; senderId: string; text: string; createdAt: number };

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { user: authUser } = useAuth();
  const chatWidth = responsive.isDesktop ? 720 : responsive.contentMaxWidth;
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [remaining, setRemaining] = useState(CHAT_LIFETIME_MS);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatExpiresAt, setChatExpiresAt] = useState(Date.now() + CHAT_LIFETIME_MS);
  const flatListRef = useRef<FlatList>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isReal = UUID_RE.test(id ?? '');

  const [otherName, setOtherName] = useState(() => {
    const mock = MOCK_USERS.find(u => u.id === id);
    return mock?.displayName ?? 'Usuário';
  });
  const [otherAvatar, setOtherAvatar] = useState(() => {
    return MOCK_USERS.find(u => u.id === id)?.avatar ?? '';
  });

  useEffect(() => {
    if (!isReal || !id) return;
    import('@/lib/db').then(({ getProfile }) => {
      getProfile(id).then(p => {
        if (p) {
          setOtherName(p.displayName ?? p.username);
          setOtherAvatar(p.avatar ?? '');
        }
      }).catch(() => {});
    });
  }, [id, isReal]);

  // Timer — for mock chats use mock data; for real chats use DB created_at
  const mockChat = MOCK_CHATS.find(c => c.participants.some(p => p.id === id));
  const expiresAt = isReal ? chatExpiresAt : (mockChat ? mockChat.createdAt + CHAT_LIFETIME_MS : Date.now() + CHAT_LIFETIME_MS);

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [expiresAt]);

  // Init real chat
  const initRealChat = useCallback(async () => {
    if (!authUser || !id || !isReal) return;
    try {
      const cid = await getOrCreateChat(authUser.id, id);
      setChatId(cid);
      const [msgs, createdAt] = await Promise.all([getMessages(cid), getChatCreatedAt(cid)]);
      setChatExpiresAt(createdAt + CHAT_LIFETIME_MS);
      setMessages(msgs.map(m => ({
        id: m.id,
        senderId: m.sender_id,
        text: m.text,
        createdAt: new Date(m.created_at).getTime(),
      })));
    } catch {}
  }, [authUser?.id, id]);

  useEffect(() => {
    if (isReal) {
      initRealChat();
    } else {
      // Mock messages
      setMessages([
        { id: 'm1', senderId: id ?? '', text: 'Vc ainda tá aqui?', createdAt: Date.now() - 5 * 60000 },
        { id: 'm2', senderId: authUser?.id ?? 'me', text: 'Sim! To no bar do fundo', createdAt: Date.now() - 4 * 60000 },
        { id: 'm3', senderId: id ?? '', text: 'Que ótimo! Vem aqui', createdAt: Date.now() - 2 * 60000 },
      ]);
    }
  }, [isReal, id]);

  // Realtime subscription
  useEffect(() => {
    if (!chatId) return;
    const channel = supabase
      .channel(`chat-${chatId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const m = payload.new as DBMessage;
          setMessages(prev => {
            if (prev.find(p => p.id === m.id)) return prev;
            return [...prev, {
              id: m.id,
              senderId: m.sender_id,
              text: m.text,
              createdAt: new Date(m.created_at).getTime(),
            }];
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId]);

  const send = async () => {
    if (!text.trim() || remaining <= 0) return;
    const trimmed = text.trim();
    setText('');

    if (isReal && chatId && authUser) {
      try {
        await sendMessage(chatId, authUser.id, trimmed);
      } catch {}
    } else {
      setMessages(prev => [...prev, {
        id: `m${Date.now()}`,
        senderId: authUser?.id ?? 'me',
        text: trimmed,
        createdAt: Date.now(),
      }]);
    }
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const isExpired = remaining <= 0;
  const isUrgent = remaining < 30 * 60 * 1000;

  if (isExpired) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={[styles.shell, { maxWidth: chatWidth }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
              <ChevronLeft color={Colors.textMuted} size={24} strokeWidth={2.4} />
            </TouchableOpacity>
            <Avatar uri={otherAvatar} size="sm" />
            <View style={styles.headerCopy}>
              <Text style={styles.headerName}>{otherName}</Text>
            </View>
          </View>
          <View style={styles.encerrado}>
            <LockKeyhole color={Colors.textMuted} size={44} strokeWidth={1.5} />
            <Text style={styles.encerradoTitle}>Conversa encerrada</Text>
            <Text style={styles.encerradoSub}>
              Esta conversa expirou após 8h.{'\n'}Mande uma nova mensagem para reconectar.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.shell, { maxWidth: chatWidth }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
            <ChevronLeft color={Colors.textMuted} size={24} strokeWidth={2.4} />
          </TouchableOpacity>
          <Avatar uri={otherAvatar} size="sm" />
          <View style={styles.headerCopy}>
            <Text style={styles.headerName}>{otherName}</Text>
            <Text style={styles.headerSub}>Ativo agora</Text>
          </View>
          <View style={[styles.expiryBadge, isUrgent && styles.expiryBadgeUrgent]}>
            <Timer color={Colors.secondary} size={12} strokeWidth={2.2} />
            <Text style={[styles.expiryText, isUrgent && styles.expiryTextUrgent]}>
              {formatCountdown(remaining)}
            </Text>
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => (
            <MessageBubble msg={item} myId={authUser?.id ?? 'me'} />
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={[styles.inputRow, { paddingBottom: insets.bottom + 72 }]}>
          <View style={styles.inputShell}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Mensagem..."
              placeholderTextColor={Colors.textDisabled}
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              returnKeyType="send"
              onSubmitEditing={send}
            />
            <TouchableOpacity
              onPress={send}
              style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
              disabled={!text.trim()}
            >
              <ArrowUp color={Colors.white} size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ msg, myId }: { msg: MsgRow; myId: string }) {
  const isMe = msg.senderId === myId;
  return (
    <View style={[styles.bubbleWrapper, isMe && styles.bubbleWrapperMe]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMe && { color: Colors.white }]}>{msg.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, alignItems: 'center' },
  shell: { flex: 1, width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCopy: { flex: 1 },
  headerName: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  headerSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,45,120,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,0.25)',
  },
  expiryBadgeUrgent: {
    backgroundColor: 'rgba(255,45,120,0.2)',
    borderColor: Colors.secondary,
  },
  expiryText: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.secondary,
  },
  expiryTextUrgent: { color: Colors.secondary },
  messagesList: { padding: Spacing.lg, gap: Spacing.sm, flexGrow: 1, justifyContent: 'flex-end' },
  bubbleWrapper: { flexDirection: 'row', marginBottom: Spacing.xs },
  bubbleWrapperMe: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  bubbleMe: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: FontSize.md * 1.4,
  },
  inputRow: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  sendBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
    margin: 4,
  },
  sendBtnDisabled: { backgroundColor: Colors.surface },
  encerrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing['2xl'],
  },
  encerradoTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  encerradoSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.6,
  },
});
