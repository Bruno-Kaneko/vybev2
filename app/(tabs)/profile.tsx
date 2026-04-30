import React, { useState } from 'react';
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
import { Camera, Grid3X3, LogOut, MapPin, Settings } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_POSTS } from '@/constants/MockData';
import { Avatar, VybeButton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

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

  const thumbGap = Spacing.xs;
  const contentWidth = Math.min(responsive.contentMaxWidth, responsive.width - responsive.pagePadding * 2);
  const thumbSize = (contentWidth - thumbGap * 2) / 3;

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
      await supabase.auth.updateUser({ data: { username: cleanUsername, bio: editBio.trim() } });
      setLocalUsername(cleanUsername);
      setLocalBio(editBio.trim() || null);
      setMessage('Perfil atualizado!');
      setEditOpen(false);
    } catch {
      setMessage('Erro ao salvar. Tente de novo.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Tem certeza que quer sair?')
      : await new Promise<boolean>(resolve =>
          require('react-native').Alert.alert('Sair', 'Tem certeza que quer sair?', [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Sair', style: 'destructive', onPress: () => resolve(true) },
          ])
        );
    if (!confirmed) return;
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
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.8} onPress={() => setMessage('Preferencias em breve.')}>
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
        </View>

        <View style={styles.statsRow}>
          <StatItem label="Posts" value={0} />
          <View style={styles.statDivider} />
          <StatItem label="Seguidores" value={0} />
          <View style={styles.statDivider} />
          <StatItem label="Seguindo" value={0} />
          <View style={styles.statDivider} />
          <StatItem label="Pontos" value={0} highlight />
        </View>

        <VybeButton
          label="Editar perfil"
          onPress={openEdit}
          fullWidth
          style={styles.editBtn}
        />

        <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
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
                <TouchableOpacity onPress={() => setEditOpen(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <VybeButton label="Salvar" onPress={saveEdit} loading={editLoading} style={styles.saveBtn} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {message ? <Text style={styles.feedback}>{message}</Text> : null}

        <View style={styles.postsHeader}>
          <Grid3X3 color={Colors.white} size={18} strokeWidth={2.2} />
          <Text style={styles.sectionTitle}>Posts</Text>
        </View>

        <View style={[styles.postsGrid, { gap: thumbGap }]}>
          {MOCK_POSTS.map(post => (
            <TouchableOpacity
              key={post.id}
              style={[styles.postThumb, { width: thumbSize, height: thumbSize * 1.28 }]}
              onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
              activeOpacity={0.85}
            >
              <Image source={{ uri: post.imageUrl }} style={styles.postThumbImg} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(10,10,15,0.72)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.thumbMeta}>
                <MapPin color={Colors.textMuted} size={11} strokeWidth={2.2} />
                <Text style={styles.postThumbPlace} numberOfLines={1}>{post.placeName}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, highlight && { color: Colors.gold }]}>
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
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
});
