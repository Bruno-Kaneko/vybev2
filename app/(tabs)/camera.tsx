import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Clock3, ImagePlus, MapPin, Send, X } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { VybeButton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import type { TimerDuration } from '@/types';

const TIMER_OPTIONS: TimerDuration[] = [2, 4, 6];

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
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
    await new Promise(r => setTimeout(r, 1000));
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: responsive.pagePadding,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.shell, { maxWidth: responsive.formMaxWidth }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <X color={Colors.textMuted} size={20} strokeWidth={2.4} />
            </TouchableOpacity>
            <Text style={styles.title}>Novo Post</Text>
            <View style={{ width: 36 }} />
          </View>

          <TouchableOpacity onPress={pickImage} style={styles.imagePicker} activeOpacity={0.9}>
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.placeholderIcon}>
                  <ImagePlus color={Colors.secondary} size={40} strokeWidth={1.9} />
                </View>
                <Text style={styles.placeholderText}>Toque para escolher foto</Text>
                <Text style={styles.placeholderSub}>ou use a camera abaixo</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.cameraRow}>
            <TouchableOpacity onPress={takePhoto} style={styles.cameraBtn}>
              <Camera color={Colors.text} size={18} strokeWidth={2.2} />
              <Text style={styles.cameraBtnLabel}>Camera</Text>
            </TouchableOpacity>
            {image && (
              <TouchableOpacity onPress={() => setImage(null)} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Trocar foto</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Clock3 color={Colors.secondary} size={20} strokeWidth={2.2} />
              <Text style={styles.sectionTitle}>Quanto tempo dura?</Text>
            </View>
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

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MapPin color={Colors.secondary} size={20} strokeWidth={2.2} />
              <Text style={styles.sectionTitle}>Localizacao</Text>
            </View>
            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <MapPin color={Colors.secondary} size={22} strokeWidth={2.2} />
              </View>
              <View>
                <Text style={styles.locationName}>Detectando localizacao...</Text>
                <Text style={styles.locationSub}>Toque para alterar</Text>
              </View>
            </View>
          </View>

          <View style={styles.postSection}>
            <VybeButton
              label={image ? 'Publicar agora' : 'Escolha uma foto primeiro'}
              onPress={handlePost}
              loading={loading}
              disabled={!image}
              fullWidth
              size="lg"
            />
            {image ? (
              <View style={styles.readyRow}>
                <Send color={Colors.secondary} size={16} strokeWidth={2.2} />
                <Text style={styles.readyText}>Tudo pronto para publicar</Text>
              </View>
            ) : null}
          </View>
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
  scrollContent: {
    alignItems: 'center',
  },
  shell: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 9 / 12,
    maxHeight: 520,
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
    padding: Spacing.xl,
  },
  placeholderIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    marginBottom: Spacing.xs,
  },
  placeholderText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  placeholderSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textDisabled,
    textAlign: 'center',
  },
  cameraRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: Spacing['2xl'],
    gap: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: Spacing['3xl'],
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
  },
  readyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
