import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';

import { Colors, FontFamily, FontSize, Spacing } from '@/constants';
import { MOCK_CHATS, MOCK_USERS } from '@/constants/MockData';
import { Avatar, Badge } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import { getChats } from '@/lib/db';
import type { DBChat } from '@/lib/db';
import type { Chat } from '@/types';

type RowItem = {
  id: string;
  otherId: string;
  otherName: string;
  otherAvatar: string;
  lastMessage?: string;
  lastMessageAt?: number;
  unread: number;
};

function toRowItem(chat: DBChat, myId: string): RowItem {
  const iAmA = chat.participant_a === myId;
  const other = iAmA ? chat.profile_b : chat.profile_a;
  return {
    id: chat.id,
    otherId: iAmA ? chat.participant_b : chat.participant_a,
    otherName: other?.display_name ?? other?.username ?? 'Usuário',
    otherAvatar: other?.avatar_url ?? '',
    lastMessage: chat.last_message ?? undefined,
    lastMessageAt: chat.last_message_at ? new Date(chat.last_message_at).getTime() : undefined,
    unread: iAmA ? chat.unread_a : chat.unread_b,
  };
}

function mockToRow(chat: Chat): RowItem {
  const other = chat.participants[0];
  return {
    id: chat.id,
    otherId: other.id,
    otherName: other.displayName,
    otherAvatar: other.avatar,
    lastMessage: chat.lastMessage,
    lastMessageAt: chat.lastMessageAt,
    unread: chat.unreadCount,
  };
}

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { user } = useAuth();
  const [rows, setRows] = useState<RowItem[]>(MOCK_CHATS.map(mockToRow));

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const real = await getChats(user.id);
      if (real.length > 0) {
        setRows(real.map(c => toRowItem(c, user.id)));
      } else {
        setRows(MOCK_CHATS.map(mockToRow));
      }
    } catch {
      setRows(MOCK_CHATS.map(mockToRow));
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        data={rows}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: responsive.pagePadding, paddingBottom: insets.bottom + 110 },
        ]}
        ListHeaderComponent={
          <View style={[styles.header, { maxWidth: responsive.contentMaxWidth }]}>
            <Text style={styles.title}>Mensagens</Text>
          </View>
        }
        renderItem={({ item }) => <ChatRow row={item} maxWidth={responsive.contentMaxWidth} />}
        ListEmptyComponent={
          <View style={[styles.empty, { maxWidth: responsive.contentMaxWidth }]}>
            <MessageCircle color={Colors.textMuted} size={54} strokeWidth={1.8} />
            <Text style={styles.emptyTitle}>Nenhuma mensagem ainda</Text>
            <Text style={styles.emptySub}>Converse com quem está na mesma festa.</Text>
          </View>
        }
      />
    </View>
  );
}

function ChatRow({ row, maxWidth }: { row: RowItem; maxWidth: number }) {
  return (
    <TouchableOpacity
      style={[styles.chatRow, { maxWidth }]}
      onPress={() => router.push(`/(tabs)/chat/${row.otherId}`)}
      activeOpacity={0.8}
    >
      <View style={styles.avatarWrapper}>
        <Avatar uri={row.otherAvatar} size="md" />
        {row.unread > 0 && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatName}>{row.otherName}</Text>
          <Text style={styles.chatTime}>{row.lastMessageAt ? formatTimeAgo(row.lastMessageAt) : ''}</Text>
        </View>
        <View style={styles.chatBottomRow}>
          <Text style={styles.chatPreview} numberOfLines={1}>{row.lastMessage}</Text>
          {row.unread > 0 && <Badge count={row.unread} />}
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
  root: { flex: 1, backgroundColor: Colors.background },
  listContent: { alignItems: 'center' },
  header: {
    width: '100%',
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['3xl'],
    color: Colors.white,
  },
  chatRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarWrapper: { position: 'relative' },
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
  chatInfo: { flex: 1, minWidth: 0 },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  chatName: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  chatTime: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatPreview: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  empty: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  emptySub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
