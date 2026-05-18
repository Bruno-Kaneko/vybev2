import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, Modal,
  Animated, Pressable, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, MoreHorizontal, Trash2, X } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import {
  getUserActiveStories, markStoryViewed, deleteStory, getStoryViewers,
  type DBStory,
} from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { getProfile } from '@/lib/db';
import type { User } from '@/types';

const SLIDE_DURATION = 5000; // 5s por story

type StoryViewerProps = {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
  onDeleted?: () => void;
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export function StoryViewer({ visible, userId, onClose, onDeleted }: StoryViewerProps) {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [stories, setStories] = useState<DBStory[]>([]);
  const [index, setIndex] = useState(0);
  const [author, setAuthor] = useState<User | null>(null);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<Awaited<ReturnType<typeof getStoryViewers>>>([]);
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const isMine = userId === authUser?.id;
  const current = stories[index];

  // Carrega stories + author
  useEffect(() => {
    if (!visible || !userId) return;
    setIndex(0);
    Promise.all([getUserActiveStories(userId), getProfile(userId)]).then(([list, p]) => {
      setStories(list);
      setAuthor(p);
    });
  }, [visible, userId]);

  // Marca como visto + progress
  useEffect(() => {
    if (!visible || !current) return;
    progress.setValue(0);
    if (paused) return;

    // Marca como visto (não bloqueia)
    if (authUser?.id) markStoryViewed(current.id, authUser.id).catch(() => {});

    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_DURATION,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) goNext();
    });

    return () => { animRef.current?.stop(); };
  }, [visible, current?.id, paused]);

  const goNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex(i => i + 1);
    } else {
      onClose();
    }
  }, [index, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) setIndex(i => i - 1);
  }, [index]);

  const handleDelete = async () => {
    if (!current) return;
    setMenuOpen(false);
    Alert.alert('Excluir story?', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStory(current.id);
            onDeleted?.();
            onClose();
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir.');
          }
        },
      },
    ]);
  };

  const openViewers = async () => {
    if (!current) return;
    setPaused(true);
    try {
      const list = await getStoryViewers(current.id);
      setViewers(list);
      setViewersOpen(true);
    } catch {}
  };

  if (!current || !author) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.root}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Imagem ou tela colorida */}
        {current.media_url ? (
          <Image source={{ uri: current.media_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: current.bg_color ?? Colors.surface }]}>
            <View style={styles.textOnlyWrap}>
              <Text style={styles.textOnly}>{current.caption}</Text>
            </View>
          </View>
        )}

        {/* Gradiente top */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={[styles.gradientTop, { paddingTop: insets.top }]}
        >
          {/* Progress bars */}
          <View style={styles.progressRow}>
            {stories.map((_, i) => (
              <View key={i} style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: i < index ? '100%' : i > index ? '0%' : progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          {/* Author + close */}
          <View style={styles.header}>
            <View style={styles.authorRow}>
              <Image source={{ uri: author.avatar ?? '' }} style={styles.authorAvatar} />
              <Text style={styles.authorName}>{author.displayName}</Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(current.created_at)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              {isMine && (
                <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.headerBtn}>
                  <MoreHorizontal color={Colors.white} size={22} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                <X color={Colors.white} size={22} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        {/* Caption (quando tem media + texto) */}
        {current.media_url && current.caption ? (
          <View style={[styles.captionWrap, { bottom: insets.bottom + (isMine ? 90 : 40) }]}>
            <Text style={styles.caption}>{current.caption}</Text>
          </View>
        ) : null}

        {/* Footer "Visualizações" (só pra mim) */}
        {isMine && (
          <TouchableOpacity
            style={[styles.viewersBtn, { bottom: insets.bottom + Spacing.md }]}
            onPress={openViewers}
            activeOpacity={0.85}
          >
            <Eye color={Colors.white} size={18} strokeWidth={2.2} />
            <Text style={styles.viewersText}>Visualizações</Text>
          </TouchableOpacity>
        )}

        {/* Tap areas (esquerda = anterior, direita = próximo, long press = pausa) */}
        <Pressable
          style={[styles.tapArea, { left: 0 }]}
          onPress={goPrev}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
        />
        <Pressable
          style={[styles.tapArea, { right: 0 }]}
          onPress={goNext}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
        />

        {/* Menu de ações (deletar) */}
        <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)}>
            <View style={styles.menuSheet} onStartShouldSetResponder={() => true}>
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete} activeOpacity={0.75}>
                <Trash2 color={Colors.urgent} size={18} strokeWidth={2.2} />
                <Text style={[styles.menuItemText, { color: Colors.urgent }]}>Excluir story</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal de visualizações */}
        <Modal
          visible={viewersOpen}
          transparent
          animationType="slide"
          onRequestClose={() => { setViewersOpen(false); setPaused(false); }}
        >
          <View style={styles.viewersOverlay}>
            <View style={[styles.viewersSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
              <View style={styles.viewersHeader}>
                <Text style={styles.viewersTitle}>{viewers.length} {viewers.length === 1 ? 'visualização' : 'visualizações'}</Text>
                <TouchableOpacity onPress={() => { setViewersOpen(false); setPaused(false); }}>
                  <X color={Colors.textMuted} size={20} strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
              {viewers.length === 0 ? (
                <Text style={styles.viewersEmpty}>Ninguém viu ainda</Text>
              ) : (
                viewers.map(v => (
                  <View key={v.id} style={styles.viewerRow}>
                    <Image source={{ uri: v.avatar_url ?? '' }} style={styles.viewerAvatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.viewerName}>{v.display_name ?? v.username}</Text>
                      <Text style={styles.viewerHandle}>@{v.username}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  gradientTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg,
  },
  progressRow: { flexDirection: 'row', gap: 4, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  progressTrack: {
    flex: 1, height: 2.5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1.5, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  authorRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  authorAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface },
  authorName: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.white },
  timeAgo: { fontFamily: FontFamily.body, fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  tapArea: { position: 'absolute', top: 0, bottom: 0, width: '40%' },
  textOnlyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  textOnly: {
    fontFamily: FontFamily.heading, fontSize: FontSize['2xl'],
    color: Colors.white, textAlign: 'center', lineHeight: FontSize['2xl'] * 1.3,
  },
  captionWrap: {
    position: 'absolute', left: Spacing.lg, right: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: Spacing.md, borderRadius: Radius.md,
  },
  caption: { fontFamily: FontFamily.body, fontSize: FontSize.md, color: Colors.white },
  viewersBtn: {
    position: 'absolute', left: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  viewersText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.white },
  menuOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl,
  },
  menuSheet: {
    width: '100%', maxWidth: 320, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.md,
  },
  menuItemText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.text },
  viewersOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  viewersSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md, paddingHorizontal: Spacing.lg, maxHeight: '70%',
  },
  viewersHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  viewersTitle: { fontFamily: FontFamily.heading, fontSize: FontSize.lg, color: Colors.white },
  viewersEmpty: {
    fontFamily: FontFamily.body, fontSize: FontSize.md,
    color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.xl,
  },
  viewerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  viewerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.background },
  viewerName: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.white },
  viewerHandle: { fontFamily: FontFamily.body, fontSize: FontSize.xs, color: Colors.textMuted },
});
