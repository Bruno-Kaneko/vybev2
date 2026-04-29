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
import { BlurView } from 'expo-blur';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_USERS } from '@/constants/MockData';
import { Avatar } from '@/components/ui';

const MOCK_MESSAGES = [
  { id: 'm1', senderId: '1', text: 'Vc ainda tá aqui?', createdAt: Date.now() - 5 * 60000 },
  { id: 'm2', senderId: 'me', text: 'Sim! Tô no bar do fundo', createdAt: Date.now() - 4 * 60000 },
  { id: 'm3', senderId: '1', text: 'Que ótimo! Vem aqui 🔥', createdAt: Date.now() - 2 * 60000 },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Avatar uri={user.avatar} size="sm" />
        <View>
          <Text style={styles.headerName}>{user.displayName}</Text>
          <Text style={styles.headerSub}>@{user.username}</Text>
        </View>
      </View>

      {/* Same place banner */}
      <View style={styles.samePlaceBanner}>
        <Text style={styles.samePlaceText}>🔥 Vocês estão no mesmo lugar agora!</Text>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        inverted={false}
      />

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Mensagem..."
          placeholderTextColor={Colors.textDisabled}
          style={styles.input}
          multiline
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <TouchableOpacity onPress={send} style={styles.sendBtn} disabled={!text.trim()}>
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    marginRight: Spacing.xs,
  },
  backIcon: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.textMuted,
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
  samePlaceBanner: {
    backgroundColor: 'rgba(255, 45, 120, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 45, 120, 0.2)',
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  samePlaceText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.secondary,
  },
  messagesList: {
    padding: Spacing.xl,
    gap: Spacing.md,
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
    maxWidth: '78%',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleMe: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: FontSize.md * 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  sendIcon: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
});
