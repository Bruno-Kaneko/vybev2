import React, { useState, useEffect, useRef } from 'react';
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

const CHAT_LIFETIME_MS = 8 * 3600 * 1000;

const MOCK_MESSAGES = [
  { id: 'm1', senderId: '1', text: 'Vc ainda ta aqui?', createdAt: Date.now() - 5 * 60000 },
  { id: 'm2', senderId: 'me', text: 'Sim! To no bar do fundo', createdAt: Date.now() - 4 * 60000 },
  { id: 'm3', senderId: '1', text: 'Que otimo! Vem aqui', createdAt: Date.now() - 2 * 60000 },
];

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
  const chatWidth = responsive.isDesktop ? 720 : responsive.contentMaxWidth;
  const [text, setText] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user = MOCK_USERS.find(u => u.id === id) ?? MOCK_USERS[0];
  const chat = MOCK_CHATS.find(c => c.participants.some(p => p.id === id));
  const expiresAt = chat ? chat.createdAt + CHAT_LIFETIME_MS : Date.now() + CHAT_LIFETIME_MS;

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, expiresAt - Date.now()));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [expiresAt]);

  const isExpired = remaining <= 0;
  const isUrgent = remaining < 30 * 60 * 1000;

  const send = () => {
    if (!text.trim() || isExpired) return;
    setMessages(prev => [...prev, { id: `m${Date.now()}`, senderId: 'me', text: text.trim(), createdAt: Date.now() }]);
    setText('');
  };

  if (isExpired) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={[styles.shell, { maxWidth: chatWidth }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
              <ChevronLeft color={Colors.textMuted} size={24} strokeWidth={2.4} />
            </TouchableOpacity>
            <Avatar uri={user.avatar} size="sm" />
            <View style={styles.headerCopy}>
              <Text style={styles.headerName}>{user.displayName}</Text>
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
          <Avatar uri={user.avatar} size="sm" />
          <View style={styles.headerCopy}>
            <Text style={styles.headerName}>{user.displayName}</Text>
            <Text style={styles.headerSub}>Ativo agora</Text>
          </View>
          <View style={[styles.expiryBadge, isUrgent && styles.expiryBadgeUrgent]}>
            <Timer color={isUrgent ? Colors.secondary : Colors.secondary} size={12} strokeWidth={2.2} />
            <Text style={[styles.expiryText, isUrgent && styles.expiryTextUrgent]}>
              {formatCountdown(remaining)}
            </Text>
          </View>
        </View>

        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          inverted={false}
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
            <TouchableOpacity onPress={send} style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]} disabled={!text.trim()}>
              <ArrowUp color={Colors.white} size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ msg }: { msg: typeof MOCK_MESSAGES[0] }) {
  const isMe = msg.senderId === 'me';
  return (
    <View style={[styles.bubbleWrapper, isMe && styles.bubbleWrapperMe]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isMe && { color: Colors.white }]}>
          {msg.text}
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    marginRight: Spacing.xs,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,45,120,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,0.25)',
  },
  expiryBadgeUrgent: {
    backgroundColor: 'rgba(255,45,120,0.22)',
    borderColor: Colors.secondary,
  },
  expiryText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
    color: Colors.secondary,
  },
  expiryTextUrgent: {
    color: Colors.secondary,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  headerSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  messagesList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  bubbleWrapper: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  bubbleWrapperMe: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '72%',
    borderRadius: 22,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 7,
  },
  bubbleMe: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 7,
  },
  bubbleText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: FontSize.md * 1.5,
  },
  inputRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.background,
  },
  inputShell: {
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
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  sendBtn: {
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
  sendBtnDisabled: {
    opacity: 0.4,
  },
  encerrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
  },
  encerradoTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  encerradoSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.6,
  },
});
