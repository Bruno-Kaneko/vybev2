import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing } from '@/constants';
import { getActiveStories } from '@/lib/db';
import type { StoryWithAuthor } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Skeleton } from './Skeleton';

type StoryBarProps = {
  onOpenStory: (userId: string) => void;
  onCreateStory: () => void;
};

// Agrupa stories por user (cada user vira 1 bolinha)
function groupByUser(stories: StoryWithAuthor[]) {
  const map = new Map<string, { author: StoryWithAuthor['author']; stories: StoryWithAuthor[]; hasUnviewed: boolean }>();
  // Mais recentes primeiro vêm em getActiveStories — pra ordem dentro do user, invertemos
  for (const s of stories) {
    if (!map.has(s.user_id)) {
      map.set(s.user_id, { author: s.author, stories: [], hasUnviewed: false });
    }
    const entry = map.get(s.user_id)!;
    entry.stories.push(s);
    if (!s.viewed) entry.hasUnviewed = true;
  }
  return [...map.values()];
}

export function StoryBar({ onOpenStory, onCreateStory }: StoryBarProps) {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getActiveStories(user?.id);
      setStories(data);
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Real-time: atualiza quando alguém cria/deleta story
  useEffect(() => {
    const channel = supabase
      .channel('stories_bar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const grouped = useMemo(() => groupByUser(stories), [stories]);
  const myGroup = grouped.find(g => g.author.id === user?.id);
  const otherGroups = grouped.filter(g => g.author.id !== user?.id);

  if (loading) {
    return (
      <View style={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {[0, 1, 2, 3, 4].map(i => (
            <View key={i} style={{ alignItems: 'center', gap: 6 }}>
              <Skeleton width={64} height={64} borderRadius={32} />
              <Skeleton width={48} height={10} borderRadius={5} />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {/* Seu próprio item — abre câmera se não tiver story, ou abre o viewer + opção de adicionar */}
        <TouchableOpacity
          style={styles.item}
          activeOpacity={0.85}
          onPress={() => {
            if (myGroup) onOpenStory(user!.id);
            else onCreateStory();
          }}
        >
          <View style={styles.avatarOuter}>
            {myGroup ? (
              <LinearGradient
                colors={Colors.gradientBrand}
                style={styles.gradientRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.avatarInnerWrap}>
                  <Image source={{ uri: myGroup.author.avatar_url ?? '' }} style={styles.avatar} />
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.avatarPlain}>
                <Image source={{ uri: '' }} style={styles.avatar} />
              </View>
            )}
            <View style={styles.plusBadge}>
              <Plus color={Colors.white} size={14} strokeWidth={3} />
            </View>
          </View>
          <Text style={styles.label} numberOfLines={1}>Seu story</Text>
        </TouchableOpacity>

        {/* Stories dos outros */}
        {otherGroups.map(group => {
          const displayName = group.author.display_name ?? group.author.username;
          return (
            <TouchableOpacity
              key={group.author.id}
              style={styles.item}
              activeOpacity={0.85}
              onPress={() => onOpenStory(group.author.id)}
            >
              <View style={styles.avatarOuter}>
                {group.hasUnviewed ? (
                  <LinearGradient
                    colors={Colors.gradientBrand}
                    style={styles.gradientRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.avatarInnerWrap}>
                      <Image source={{ uri: group.author.avatar_url ?? '' }} style={styles.avatar} />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.viewedRing}>
                    <Image source={{ uri: group.author.avatar_url ?? '' }} style={styles.avatar} />
                  </View>
                )}
              </View>
              <Text style={styles.label} numberOfLines={1}>{displayName}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const RING = 68;
const AVATAR = 60;

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'center',
  },
  item: { alignItems: 'center', gap: 6, width: 72 },
  avatarOuter: { position: 'relative', width: RING, height: RING },
  gradientRing: {
    width: RING, height: RING, borderRadius: RING / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInnerWrap: {
    width: AVATAR + 4, height: AVATAR + 4, borderRadius: (AVATAR + 4) / 2,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  viewedRing: {
    width: RING, height: RING, borderRadius: RING / 2,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPlain: {
    width: RING, height: RING, borderRadius: RING / 2,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2,
    backgroundColor: Colors.surface,
  },
  plusBadge: {
    position: 'absolute', bottom: 0, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.secondary,
    borderWidth: 2, borderColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  label: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    maxWidth: 72,
  },
});
