import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, TextInput,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera as CameraIcon, ImageIcon, SwitchCamera, Type, X } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { createStory, uploadStoryMedia } from '@/lib/db';

const BG_COLORS = ['#FF2D78', '#7B2FFF', '#22C55E', '#F59E0B', '#3B82F6', '#0A0A0F'];

type Mode = 'camera' | 'edit-photo' | 'edit-text';

export default function CreateStoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [mode, setMode] = useState<Mode>('camera');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [posting, setPosting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });
    if (!res.canceled) {
      setImageUri(res.assets[0].uri);
      setMode('edit-photo');
    }
  };

  const shoot = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setImageUri(photo.uri);
        setMode('edit-photo');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!user) return;
    setPosting(true);
    try {
      let mediaUrl: string | undefined;
      if (mode === 'edit-photo' && imageUri) {
        mediaUrl = await uploadStoryMedia(user.id, imageUri);
      }
      await createStory({
        userId: user.id,
        mediaUrl,
        caption: caption.trim() || undefined,
        bgColor: mode === 'edit-text' ? bgColor : undefined,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível publicar.');
    } finally {
      setPosting(false);
    }
  };

  // ── Permissão da câmera ──
  if (mode === 'camera' && !permission) {
    return <View style={[styles.root, styles.center]}><ActivityIndicator color={Colors.white} /></View>;
  }

  if (mode === 'camera' && permission && !permission.granted) {
    return (
      <View style={[styles.root, styles.center, { padding: Spacing.xl, gap: Spacing.lg }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <X color={Colors.white} size={22} strokeWidth={2.4} />
        </TouchableOpacity>
        <CameraIcon color={Colors.secondary} size={48} strokeWidth={1.8} />
        <Text style={styles.permTitle}>Acesso à câmera</Text>
        <Text style={styles.permSub}>Precisamos da câmera pra capturar seu momento.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Permitir</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Modo: tirar foto ──
  if (mode === 'camera') {
    return (
      <View style={styles.root}>
        <CameraView key={facing} ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

        <View style={[styles.topBar, { top: insets.top + Spacing.md }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <X color={Colors.white} size={22} strokeWidth={2.4} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
            <SwitchCamera color={Colors.white} size={22} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <View style={[styles.modeSwitch, { top: insets.top + Spacing.md + 56 }]}>
          <TouchableOpacity style={styles.modePill} onPress={() => setMode('edit-text')}>
            <Type color={Colors.white} size={16} strokeWidth={2.2} />
            <Text style={styles.modePillText}>Texto</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
            <ImageIcon color={Colors.white} size={24} strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shutter} onPress={shoot} disabled={busy} activeOpacity={0.85}>
            {busy ? <ActivityIndicator color={Colors.white} /> : <View style={styles.shutterInner} />}
          </TouchableOpacity>
          <View style={{ width: 44 }} />
        </View>
      </View>
    );
  }

  // ── Modo: editar texto ──
  if (mode === 'edit-text') {
    return (
      <View style={[styles.root, { backgroundColor: bgColor }]}>
        <View style={[styles.topBar, { top: insets.top + Spacing.md }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setMode('camera')}>
            <X color={Colors.white} size={22} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <View style={styles.textEditWrap}>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Digite algo..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={styles.textInput}
            multiline
            maxLength={150}
            autoFocus
          />
        </View>

        <View style={[styles.colorPickerWrap, { bottom: insets.bottom + Spacing.lg + 70 }]}>
          {BG_COLORS.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, bgColor === c && styles.colorDotActive]}
              onPress={() => setBgColor(c)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.publishBtn, { bottom: insets.bottom + Spacing.md }, (!caption.trim() || posting) && { opacity: 0.5 }]}
          onPress={publish}
          disabled={!caption.trim() || posting}
        >
          {posting
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.publishText}>Publicar</Text>
          }
        </TouchableOpacity>
      </View>
    );
  }

  // ── Modo: editar foto ──
  return (
    <View style={styles.root}>
      <Image source={{ uri: imageUri! }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      <View style={[styles.topBar, { top: insets.top + Spacing.md }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => { setImageUri(null); setMode('camera'); }}>
          <X color={Colors.white} size={22} strokeWidth={2.4} />
        </TouchableOpacity>
      </View>

      <View style={[styles.captionWrap, { bottom: insets.bottom + 110 }]}>
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Adicionar texto (opcional)..."
          placeholderTextColor="rgba(255,255,255,0.6)"
          style={[styles.captionInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
          maxLength={150}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.publishBtn, { bottom: insets.bottom + Spacing.md }, posting && { opacity: 0.5 }]}
        onPress={publish}
        disabled={posting}
      >
        {posting
          ? <ActivityIndicator color={Colors.white} />
          : <Text style={styles.publishText}>Publicar story</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute', left: Spacing.lg, right: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', zIndex: 10,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: { position: 'absolute', top: 60, left: Spacing.lg, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modeSwitch: { position: 'absolute', left: Spacing.lg, flexDirection: 'row', gap: Spacing.sm },
  modePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  modePillText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, color: Colors.white },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: Spacing.xl,
  },
  galleryBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },
  shutter: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.white },
  permTitle: { fontFamily: FontFamily.heading, fontSize: FontSize.xl, color: Colors.white, textAlign: 'center' },
  permSub: { fontFamily: FontFamily.body, fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center' },
  permBtn: {
    paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md,
    backgroundColor: Colors.secondary, borderRadius: Radius.full,
  },
  permBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.md, color: Colors.white },
  textEditWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  textInput: {
    fontFamily: FontFamily.heading, fontSize: FontSize['2xl'],
    color: Colors.white, textAlign: 'center', minHeight: 100,
  },
  colorPickerWrap: {
    position: 'absolute', left: Spacing.lg, right: Spacing.lg,
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.md,
  },
  colorDot: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  colorDotActive: { borderColor: Colors.white, borderWidth: 3 },
  captionWrap: {
    position: 'absolute', left: Spacing.lg, right: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: Spacing.md, borderRadius: Radius.md,
  },
  captionInput: {
    fontFamily: FontFamily.body, fontSize: FontSize.md,
    color: Colors.white, minHeight: 40, padding: 0,
  },
  publishBtn: {
    position: 'absolute', left: Spacing.lg, right: Spacing.lg,
    height: 56, borderRadius: Radius.full,
    backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center',
  },
  publishText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.md, color: Colors.white },
});
