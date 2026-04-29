import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { VybeButton } from '@/components/ui';
import type { TimerDuration } from '@/types';

const TIMER_OPTIONS: TimerDuration[] = [2, 4, 6];

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const [image, setImage] = useState<string | null>(null);
  const [timer, setTimer] = useState<TimerDuration>(4);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [9, 16],
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [9, 16],
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!image) return;
    setLoading(true);
    // TODO: upload to Firebase + create post
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Novo Post</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Image picker */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker} activeOpacity={0.9}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>📷</Text>
              <Text style={styles.placeholderText}>Toque para escolher foto</Text>
              <Text style={styles.placeholderSub}>ou use a câmera abaixo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Camera button */}
        <View style={styles.cameraRow}>
          <TouchableOpacity onPress={takePhoto} style={styles.cameraBtn}>
            <Text style={styles.cameraBtnIcon}>📸</Text>
            <Text style={styles.cameraBtnLabel}>Câmera</Text>
          </TouchableOpacity>
          {image && (
            <TouchableOpacity onPress={() => setImage(null)} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Trocar foto</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Timer selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ Quanto tempo dura?</Text>
          <View style={styles.timerRow}>
            {TIMER_OPTIONS.map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setTimer(t)}
                style={[styles.timerPill, timer === t && styles.timerPillActive]}
              >
                {timer === t ? (
                  <LinearGradient
                    colors={Colors.gradientBrand}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                ) : null}
                <Text style={[styles.timerText, timer === t && { color: Colors.white }]}>
                  {t}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.timerHint}>Post desaparece em {timer} horas</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Localização</Text>
          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <View>
              <Text style={styles.locationName}>Detectando localização...</Text>
              <Text style={styles.locationSub}>Toque para alterar</Text>
            </View>
          </View>
        </View>

        {/* Post button */}
        <View style={styles.postSection}>
          <VybeButton
            label={image ? '🚀 Publicar agora' : 'Escolha uma foto primeiro'}
            onPress={handlePost}
            loading={loading}
            disabled={!image}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  imagePicker: {
    marginHorizontal: Spacing.xl,
    height: 340,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewImage: {
    flex: 1,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  placeholderEmoji: {
    fontSize: 48,
    marginBottom: Spacing.xs,
  },
  placeholderText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.textMuted,
  },
  placeholderSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textDisabled,
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cameraBtnIcon: {
    fontSize: 18,
  },
  cameraBtnLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  clearBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  clearBtnText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing['2xl'],
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  timerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timerPill: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  timerPillActive: {
    borderColor: Colors.secondary,
  },
  timerText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.lg,
    color: Colors.textMuted,
  },
  timerHint: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  locationIcon: {
    fontSize: 24,
  },
  locationName: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  locationSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  postSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing['3xl'],
  },
});
