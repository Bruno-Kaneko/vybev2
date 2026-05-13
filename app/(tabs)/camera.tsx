import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, Modal, ActivityIndicator, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, Clock3, MapPin, Send, X, Camera, AlertCircle, AlignLeft } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_PLACES } from '@/constants/MockData';
import { VybeButton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import { uploadPostImage, createPost, haversineKm } from '@/lib/db';
import type { TimerDuration } from '@/types';

const TIMER_OPTIONS: TimerDuration[] = [2, 4, 6];
const MAX_POST_RADIUS_KM = 0.5;

type NearbyPlace = {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  distanceM: number;
};

type LocationStatus = 'loading' | 'granted' | 'denied' | 'error';

function LocationRow({ item, selected, onPress }: { item: NearbyPlace; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.locRow, selected && styles.locRowActive]} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.locIconWrap}>
        <MapPin color={selected ? Colors.secondary : Colors.textMuted} size={18} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.locName, selected && { color: Colors.white }]}>{item.name}</Text>
        <Text style={styles.locAddr} numberOfLines={1}>{item.address} · {item.neighborhood}</Text>
      </View>
      <Text style={styles.locDistance}>{item.distanceM < 1000 ? `${item.distanceM}m` : `${(item.distanceM / 1000).toFixed(1)}km`}</Text>
      {selected && <Check color={Colors.secondary} size={18} strokeWidth={2.4} />}
    </TouchableOpacity>
  );
}

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [timer, setTimer] = useState<TimerDuration>(4);
  const [loading, setLoading] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [neighborhood, setNeighborhood] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }

      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = pos.coords;

        const nearby = MOCK_PLACES
          .map(p => ({
            id: p.id,
            name: p.name,
            address: p.address,
            neighborhood: p.neighborhood ?? '',
            distanceM: Math.round(haversineKm(latitude, longitude, p.location.latitude, p.location.longitude) * 1000),
          }))
          .filter(p => p.distanceM <= MAX_POST_RADIUS_KM * 1000)
          .sort((a, b) => a.distanceM - b.distanceM);

        setNearbyPlaces(nearby);
        if (nearby.length > 0) setSelectedPlace(nearby[0]);

        try {
          const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
          setNeighborhood(geo?.district ?? geo?.subregion ?? geo?.city ?? null);
        } catch {
          setNeighborhood(nearby[0]?.neighborhood ?? null);
        }

        setLocationStatus('granted');
      } catch {
        setLocationStatus('error');
      }
    })();
  }, []);

  const openCamera = async () => {
    if (Platform.OS === 'web') {
      // Web não suporta câmera direta — abre seletor de arquivo
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [9, 12],
      });
      if (!result.canceled) setImage(result.assets[0].uri);
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Câmera bloqueada', 'Permita o acesso à câmera nas configurações do celular.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [9, 12],
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handleBack = () => {
    if (image) {
      Alert.alert('Descartar post?', 'Sua foto será perdida.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  };

  const handlePost = async () => {
    if (!image || !selectedPlace || !user) return;
    setLoading(true);
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const imageUrl = await uploadPostImage(user.id, image);
      await createPost({
        userId: user.id,
        imageUrl,
        caption: caption.trim() || undefined,
        placeName: selectedPlace.name,
        placeId: selectedPlace.id,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        durationHours: timer,
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Erro ao publicar', e?.message ?? 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const canPost = !!image && locationStatus === 'granted' && !!selectedPlace;

  const postButtonLabel = () => {
    if (!image) return 'Tire uma foto primeiro';
    if (locationStatus === 'loading') return 'Verificando localização...';
    if (locationStatus === 'denied') return 'Localização necessária para postar';
    if (locationStatus === 'error') return 'Erro ao obter localização';
    if (!selectedPlace) return 'Você não está próximo de nenhum lugar';
    return 'Publicar agora';
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: responsive.pagePadding, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.shell, { maxWidth: responsive.formMaxWidth }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <X color={Colors.textMuted} size={20} strokeWidth={2.4} />
            </TouchableOpacity>
            <Text style={styles.title}>Novo Post</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.imagePicker}>
            {image ? (
              <>
                <Image source={{ uri: image }} style={[styles.previewImage, { transform: [{ scaleX: -1 }] }]} resizeMode="cover" />
                <View style={styles.retakeRow}>
                  <TouchableOpacity style={styles.retakeBtn} onPress={openCamera} activeOpacity={0.85}>
                    <Camera color={Colors.white} size={16} strokeWidth={2.2} />
                    <Text style={styles.retakeText}>Tirar outra</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.placeholderIcon}>
                  <Camera color={Colors.secondary} size={40} strokeWidth={1.9} />
                </View>
                <Text style={styles.placeholderText}>Tire uma foto para o seu post</Text>
                <View style={styles.photoButtons}>
                  <TouchableOpacity style={styles.photoBtn} onPress={openCamera} activeOpacity={0.85}>
                    <Camera color={Colors.secondary} size={20} strokeWidth={2.2} />
                    <Text style={styles.photoBtnText}>Abrir câmera</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
                  <Text style={[styles.timerText, timer === t && { color: Colors.white }]}>{t}h</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.timerHint}>Post desaparece em {timer} horas</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <AlignLeft color={Colors.secondary} size={20} strokeWidth={2.2} />
              <Text style={styles.sectionTitle}>Legenda</Text>
            </View>
            <TextInput
              style={styles.captionInput}
              placeholder="O que está rolando? (opcional)"
              placeholderTextColor={Colors.textDisabled}
              value={caption}
              onChangeText={setCaption}
              maxLength={120}
              multiline
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <MapPin color={Colors.secondary} size={20} strokeWidth={2.2} />
              <Text style={styles.sectionTitle}>Localização</Text>
            </View>

            {locationStatus === 'loading' ? (
              <View style={styles.locationCard}>
                <ActivityIndicator size="small" color={Colors.secondary} />
                <Text style={styles.locationSub}>Detectando sua localização...</Text>
              </View>
            ) : locationStatus === 'denied' ? (
              <View style={[styles.locationCard, styles.locationCardError]}>
                <AlertCircle color={Colors.urgent} size={22} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locationName, { color: Colors.urgent }]}>Localização necessária</Text>
                  <Text style={styles.locationSub}>Permita o acesso à localização nas configurações</Text>
                </View>
              </View>
            ) : locationStatus === 'error' ? (
              <View style={[styles.locationCard, styles.locationCardError]}>
                <AlertCircle color={Colors.urgent} size={22} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locationName, { color: Colors.urgent }]}>Erro ao obter localização</Text>
                  <Text style={styles.locationSub}>Verifique o GPS e tente novamente</Text>
                </View>
              </View>
            ) : !selectedPlace ? (
              <View style={[styles.locationCard, styles.locationCardWarn]}>
                <MapPin color={Colors.textMuted} size={22} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationName}>Nenhum lugar próximo</Text>
                  <Text style={styles.locationSub}>Você precisa estar a menos de 500m de um lugar cadastrado para postar</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.locationCard}
                onPress={() => nearbyPlaces.length > 1 && setLocationOpen(true)}
                activeOpacity={nearbyPlaces.length > 1 ? 0.85 : 1}
              >
                <View style={styles.locationIcon}>
                  <MapPin color={Colors.secondary} size={22} strokeWidth={2.2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.locationName} numberOfLines={1}>{selectedPlace.name}</Text>
                  <Text style={styles.locationSub} numberOfLines={1}>
                    {selectedPlace.distanceM}m de você{nearbyPlaces.length > 1 ? ' · Toque para alterar' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.postSection}>
            <VybeButton
              label={postButtonLabel()}
              onPress={handlePost}
              loading={loading}
              disabled={!canPost}
              fullWidth
              size="lg"
            />
            {canPost && (
              <View style={styles.readyRow}>
                <Send color={Colors.secondary} size={16} strokeWidth={2.2} />
                <Text style={styles.readyText}>Tudo pronto para publicar</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={locationOpen} transparent animationType="slide" onRequestClose={() => setLocationOpen(false)}>
        <View style={styles.locModalOverlay}>
          <View style={[styles.locModalSheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
            <View style={styles.locModalHeader}>
              <Text style={styles.locModalTitle}>Escolher localização</Text>
              <TouchableOpacity onPress={() => setLocationOpen(false)} style={styles.locModalClose}>
                <X color={Colors.textMuted} size={20} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {neighborhood && (
                <View style={styles.regionBadge}>
                  <Text style={styles.regionText}>📍 Você está em: {neighborhood}</Text>
                </View>
              )}
              <Text style={styles.locSectionHeader}>Próximos de você (menos de 500m)</Text>
              {nearbyPlaces.map(item => (
                <LocationRow
                  key={item.id}
                  item={item}
                  selected={item.id === selectedPlace?.id}
                  onPress={() => { setSelectedPlace(item); setLocationOpen(false); }}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  retakeRow: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  retakeText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  placeholderIcon: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  placeholderText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSize.lg * 1.4,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,45,120,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,0.3)',
  },
  photoBtnAlt: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.border,
  },
  photoBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.secondary,
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
  captionInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 72,
    textAlignVertical: 'top',
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
  locationCardError: {
    borderColor: 'rgba(255,59,48,0.3)',
    backgroundColor: 'rgba(255,59,48,0.06)',
  },
  locationCardWarn: {
    borderColor: Colors.border,
    opacity: 0.7,
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
  locModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  locModalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
    maxHeight: '70%',
  },
  locModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locModalTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  locModalClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locRowActive: {
    backgroundColor: 'rgba(255,45,120,0.06)',
  },
  locIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locName: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  locAddr: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
    marginTop: 2,
  },
  locDistance: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
    flexShrink: 0,
  },
  regionBadge: {
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255,45,120,0.1)',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,0.25)',
    alignSelf: 'flex-start',
  },
  regionText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.secondary,
  },
  locSectionHeader: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
});
