import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Grid3X3, LogOut, MapPin, Settings, Trash2 } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { getUserPosts, getProfile, updateRelationshipStatus, deletePost } from '@/lib/db';
import type { Post } from '@/types';
import { Avatar, VybeButton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { RelationshipStatus } from '@/types';

const STATUS_OPTIONS: { value: RelationshipStatus; label: string; color: string; bg: string }[] = [
  { value: 'solteiro',  label: 'Solteiro(a)', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { value: 'namorando', label: 'Namorando',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  { value: 'ficando',   label: 'Ficando',     color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
  { value: 'curtindo',  label: 'Só curtindo', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
];

export default function MyProfileScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [localUsername, setLocalUsername] = useState<string | null>(null);
  const [localBio, setLocalBio] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState<RelationshipStatus | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileStats, setProfileStats] = useState({ followers: 0, following: 0, points: 0 });
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    setDeleting(true);
    try {
      const target = postToDelete;
      await deletePost(target.id, target.imageUrl);
      setMyPosts(prev => prev.filter(p => p.id !== target.id));
      setPostToDelete(null);
      setMessage('Post excluído');
      setTimeout(() => setMessage(''), 2500);
    } catch (e: any) {
      setMessage(e?.message ?? 'Erro ao excluir o post.');
    } finally {
      setDeleting(false);
    }
  };

  const thumbGap = Spacing.xs;
  const contentWidth = Math.min(responsive.contentMaxWidth, responsive.width - responsive.pagePadding * 2);
  const thumbSize = (contentWidth - thumbGap * 2) / 3;

  const [myPosts, setMyPosts] = useState<Post[]>([]);
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    getUserPosts(user.id).then(p => { if (!cancelled) setMyPosts(p); }).catch(() => {});
    getProfile(user.id).then(p => {
      if (cancelled) return;
      if (p?.relationshipStatus) setLocalStatus(p.relationshipStatus as any);
      if (p?.bio) setLocalBio(p.bio);
      setProfileStats({ followers: p?.followers ?? 0, following: p?.following ?? 0, points: p?.points ?? 0 });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id]);

  const rawUsername = localUsername ?? user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'usuario';
  const username = rawUsername.replace(/^@/, '');
  const displayName = username;
  const bio = localBio ?? (user?.user_metadata?.bio as string | null) ?? null;
  const avatarUrl = localAvatar ?? (user?.user_metadata?.avatar_url as string | null) ?? null;

  const openEdit = () => {
    setEditUsername(username);
    setEditBio(bio ?? '');
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editUsername.trim()) return;
    setEditLoading(true);
    try {
      const cleanUsername = editUsername.trim().replace(/^@/, '');
      const cleanBio = editBio.trim();
      await supabase.auth.updateUser({ data: { username: cleanUsername, bio: cleanBio } });
      // Mirror to the profiles row so the value also shows in other views (e.g. /profile/[id])
      if (user?.id) {
        await supabase.from('profiles').update({ username: cleanUsername, bio: cleanBio || null }).eq('id', user.id);
      }
      setLocalUsername(cleanUsername);
      setLocalBio(cleanBio || null);
      setMessage('Perfil atualizado!');
      setEditOpen(false);
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Erro ao salvar. Tente de novo.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogout = () => setLogoutOpen(true);

  const confirmLogout = async () => {
    setLogoutOpen(false);
    await signOut();
    router.replace('/(onboarding)');
  };

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setMessage('Precisamos de permissão para acessar suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setUploadingAvatar(true);
    setMessage('');

    try {
      const ext = (uri.split('.').pop() ?? 'jpg').toLowerCase();
      const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
      const fileName = `${user!.id}/avatar.${ext}`;

      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Falha ao ler imagem'));
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { contentType: mimeType, upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setLocalAvatar(publicUrl);
      setMessage('Foto atualizada!');
    } catch (e: any) {
      setMessage(e?.message ?? 'Erro ao enviar foto. Tente de novo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { paddingTop: insets.top }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingHorizontal: responsive.pagePadding,
          paddingBottom: insets.bottom + 110,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.shell, { maxWidth: responsive.contentMaxWidth }]}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Perfil</Text>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={() => router.push('/preferences' as any)}>
              <Settings color={Colors.white} size={20} strokeWidth={2.2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={handleLogout}>
              <LogOut color={Colors.secondary} size={20} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hero}>
          <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
            <Avatar uri={avatarUrl ?? ''} size="xl" withGradientBorder />
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Camera color={Colors.white} size={14} strokeWidth={2.4} />
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{username}</Text>
          {bio ? <Text style={styles.bio}>{bio}</Text> : null}
          {(() => {
            const statusOpt = localStatus ? STATUS_OPTIONS.find(o => o.value === localStatus) : undefined;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setStatusOpen(true)}
                style={[
                  styles.statusBadge,
                  statusOpt
                    ? { backgroundColor: statusOpt.bg, borderColor: statusOpt.color + '44' }
                    : { backgroundColor: Colors.surface, borderColor: Colors.border },
                ]}
              >
                <Text style={[
                  styles.statusBadgeText,
                  statusOpt ? { color: statusOpt.color } : { color: Colors.textMuted },
                ]}>
                  {statusOpt ? statusOpt.label : '+ Status de relacionamento'}
                </Text>
              </TouchableOpacity>
            );
          })()}
        </View>

        <View style={styles.statsRow}>
          <StatItem label="Posts" value={myPosts.length} />
          <View style={styles.statDivider} />
          <StatItem
            label="Seguidores"
            value={profileStats.followers}
            onPress={user?.id ? () => router.push({ pathname: '/followers/[id]' as any, params: { id: user.id, type: 'followers' } }) : undefined}
          />
          <View style={styles.statDivider} />
          <StatItem
            label="Seguindo"
            value={profileStats.following}
            onPress={user?.id ? () => router.push({ pathname: '/followers/[id]' as any, params: { id: user.id, type: 'following' } }) : undefined}
          />
          <View style={styles.statDivider} />
          <StatItem label="Pontos" value={profileStats.points} highlight />
        </View>

        <VybeButton
          label="Editar perfil"
          onPress={openEdit}
          fullWidth
          style={styles.editBtn}
        />

        <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
          <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Editar perfil</Text>

              <Text style={styles.fieldLabel}>Nome de usuário</Text>
              <View style={styles.fieldShell}>
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  value={editUsername}
                  onChangeText={t => setEditUsername(t.replace(/\s/g, '').toLowerCase())}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.fieldInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  placeholderTextColor={Colors.textDisabled}
                />
              </View>

              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Uma frase sobre você..."
                placeholderTextColor={Colors.textDisabled}
                multiline
                style={[styles.fieldTextarea, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.cancelBtn} activeOpacity={0.7}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <VybeButton label="Salvar" onPress={saveEdit} loading={editLoading} style={styles.saveBtn} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={statusOpen} transparent animationType="fade" onRequestClose={() => setStatusOpen(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setStatusOpen(false)}>
            <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Status de relacionamento</Text>
              {STATUS_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.statusOption,
                    localStatus === opt.value && { backgroundColor: opt.bg, borderColor: opt.color + '55' },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setLocalStatus(opt.value);
                    setStatusOpen(false);
                    if (user?.id) updateRelationshipStatus(user.id, opt.value).catch(() => {});
                  }}
                >
                  <View style={[styles.statusDot, { backgroundColor: opt.color }]} />
                  <Text style={[styles.statusOptionText, localStatus === opt.value && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                  {localStatus === opt.value && (
                    <Text style={[styles.statusCheck, { color: opt.color }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              {localStatus && (
                <TouchableOpacity style={styles.clearStatus} onPress={() => {
                setLocalStatus(null);
                setStatusOpen(false);
                if (user?.id) updateRelationshipStatus(user.id, null).catch(() => {});
              }}>
                  <Text style={styles.clearStatusText}>Remover status</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={!!postToDelete} transparent animationType="fade" onRequestClose={() => !deleting && setPostToDelete(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => !deleting && setPostToDelete(null)}>
            <View style={[styles.modalSheet, styles.logoutSheet]} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Excluir post?</Text>
              <Text style={styles.logoutSubtitle}>Essa ação não pode ser desfeita.</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setPostToDelete(null)} style={styles.cancelBtn} disabled={deleting}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeletePost} style={styles.logoutConfirmBtn} disabled={deleting}>
                  {deleting
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.logoutConfirmText}>Excluir</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLogoutOpen(false)}>
            <View style={[styles.modalSheet, styles.logoutSheet]} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Sair da conta</Text>
              <Text style={styles.logoutSubtitle}>Tem certeza que quer sair?</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setLogoutOpen(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmLogout} style={styles.logoutConfirmBtn}>
                  <Text style={styles.logoutConfirmText}>Sair</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {message ? <Text style={styles.feedback}>{message}</Text> : null}

        <View style={styles.postsHeader}>
          <Grid3X3 color={Colors.white} size={18} strokeWidth={2.2} />
          <Text style={styles.sectionTitle}>Posts</Text>
        </View>

        {myPosts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Camera color={Colors.textMuted} size={36} strokeWidth={1.5} />
            <Text style={styles.emptyPostsTitle}>Nenhum post ainda</Text>
            <Text style={styles.emptyPostsSub}>Compartilhe onde você está e apareça no feed</Text>
            <TouchableOpacity
              style={styles.emptyPostsBtn}
              onPress={() => router.push('/(tabs)/camera')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyPostsBtnText}>Criar post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.postsGrid, { gap: thumbGap }]}>
            {myPosts.map(post => (
              <TouchableOpacity
                key={post.id}
                style={[styles.postThumb, { width: thumbSize, height: thumbSize * 1.28 }]}
                onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
                onLongPress={() => setPostToDelete(post)}
                delayLongPress={350}
                activeOpacity={0.85}
              >
                <Image source={{ uri: post.imageUrl }} style={styles.postThumbImg} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(10,10,15,0.72)']}
                  style={StyleSheet.absoluteFill}
                />
                <TouchableOpacity
                  style={styles.postThumbDelete}
                  onPress={() => setPostToDelete(post)}
                  hitSlop={{ top: 6, left: 6, bottom: 6, right: 6 }}
                  activeOpacity={0.7}
                >
                  <Trash2 color={Colors.white} size={13} strokeWidth={2.4} />
                </TouchableOpacity>
                <View style={styles.thumbMeta}>
                  <MapPin color={Colors.textMuted} size={11} strokeWidth={2.2} />
                  <Text style={styles.postThumbPlace} numberOfLines={1}>{post.placeName}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatItem({ label, value, highlight, onPress }: { label: string; value: number; highlight?: boolean; onPress?: () => void }) {
  const content = (
    <>
      <Text style={[styles.statValue, highlight && { color: Colors.gold }]}>
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={styles.statItem} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={styles.statItem}>{content}</View>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    alignItems: 'center',
  },
  shell: {
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['3xl'],
    color: Colors.white,
  },
  topActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingBottom: Spacing['2xl'],
    gap: Spacing.xs,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  displayName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['2xl'],
    color: Colors.white,
  },
  username: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  bio: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xs,
    lineHeight: FontSize.sm * 1.45,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  statusBadgeText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  statLabel: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  editBtn: {
    marginBottom: Spacing.md,
  },
  feedback: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  postsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.sm,
  },
  emptyPostsTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
    marginTop: Spacing.md,
  },
  emptyPostsSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing['2xl'],
    lineHeight: FontSize.sm * 1.5,
  },
  emptyPostsBtn: {
    marginTop: Spacing.md,
    height: 42,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: Radius.full,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPostsBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  postThumb: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  postThumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbMeta: {
    position: 'absolute',
    left: 5,
    right: 5,
    bottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  postThumbDelete: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postThumbPlace: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.textMuted,
  },
  // Edit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing['2xl'],
    paddingBottom: Spacing['4xl'],
    gap: Spacing.md,
  },
  modalTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['2xl'],
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    height: 50,
  },
  atSign: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginRight: 4,
  },
  fieldInput: {
    flex: 1,
    height: '100%',
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  fieldTextarea: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  saveBtn: {
    flex: 2,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOptionText: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  statusCheck: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
  },
  clearStatus: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  clearStatusText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  logoutSheet: {
    gap: Spacing.sm,
  },
  logoutSubtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  logoutConfirmBtn: {
    flex: 2,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: '#FF4444',
  },
  logoutConfirmText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
});
