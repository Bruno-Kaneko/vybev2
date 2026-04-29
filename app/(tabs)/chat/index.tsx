import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_CHATS } from '@/constants/MockData';
import { Avatar, Badge } from '@/components/ui';
import type { Chat } from '@/types';

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mensagens</Text>
      </View>

      <FlatList
        data={MOCK_CHATS}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90, paddingHorizontal: Spacing.xl }}
        renderItem={({ item, index }) => (
          <View>
            <ChatRow chat={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>Nenhuma mensagem ainda</Text>
            <Text style={styles.emptySub}>Converse com quem está na mesma festa!</Text>
          </View>
        }
      />
    </View>
  );
}

function ChatRow({ chat }: { chat: Chat }) {
  const other = chat.participants[0];
  const timeAgo = chat.lastMessageAt
    ? formatTimeAgo(chat.lastMessageAt)
    : '';

  return (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() => router.push(`/(tabs)/chat/${other.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.avatarWrapper}>
        <Avatar uri={other.avatar} size="md" />
        {chat.unreadCount > 0 && (
          <View style={styles.onlineDot} />
        )}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatName}>{other.displayName}</Text>
          <Text style={styles.chatTime}>{timeAgo}</Text>
        </View>
        <View style={styles.chatBottomRow}>
          <Text style={styles.chatPreview} numberOfLines={1}>
            {chat.lastMessage}
          </Text>
          {chat.unreadCount > 0 && <Badge count={chat.unreadCount} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['3xl'],
    color: Colors.white,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarWrapper: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  chatInfo: {
    flex: 1,
    gap: 4,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  chatTime: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
  },
  chatBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatPreview: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    flex: 1,
    marginRight: Spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.md,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  emptySub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
