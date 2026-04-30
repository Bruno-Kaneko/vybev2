import React, { useState } from 'react';
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
import { ArrowUp, ChevronLeft, Timer } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_USERS } from '@/constants/MockData';
import { Avatar } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';

const MOCK_MESSAGES = [
  { id: 'm1', senderId: '1', text: 'Vc ainda ta aqui?', createdAt: Date.now() - 5 * 60000 },
  { id: 'm2', senderId: 'me', text: 'Sim! To no bar do fundo', createdAt: Date.now() - 4 * 60000 },
  { id: 'm3', senderId: '1', text: 'Que otimo! Vem aqui', createdAt: Date.now() - 2 * 60000 },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const chatWidth = responsive.isDesktop ? 720 : responsive.contentMaxWidth;
  const [text, setText] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  const user = MOCK_USERS.find(u => u.id === id) ?? MOCK_USERS[0];

  const send = () => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { id: `m${Date.now()}`, senderId: 'me', text: text.trim(), createdAt: Date.now() }]);
    setText('');
  };

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
          <View style={styles.expiryBadge}>
            <Timer color={Colors.secondary} size={12} strokeWidth={2.2} />
            <Text style={styles.expiryText}>6h</Text>
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
  expiryText: {
    fontFamily: FontFamily.mono,
    fontSize: 11,
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
});
