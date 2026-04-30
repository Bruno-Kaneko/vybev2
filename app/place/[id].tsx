import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Linking, Modal, Animated, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  Clock,
  Copy,
  Grid2X2,
  Heart,
  Info,
  MapPin,
  Music,
  Navigation,
  Share2,
  X,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants';
import { MOCK_PLACES, MOCK_POSTS } from '@/constants/MockData';
import { useResponsive } from '@/hooks/useResponsive';

const PLACE_EXTRAS: Record<string, { parking?: { name: string; address: string }; metro?: { name: string; distanceM: number } }> = {
  p1: { parking: { name: 'Estacionamento Fama', address: 'R. Bela Cintra, 210 — Consolação' }, metro: { name: 'Consolação', distanceM: 320 } },
  p2: { parking: { name: 'Park Vila Olímpia', address: 'R. Olimpíadas, 66 — Vila Olímpia' }, metro: { name: 'Vila Olímpia', distanceM: 180 } },
  p3: { parking: { name: 'Estacionamento Central', address: 'Av. Rebouças, 3970 — Pinheiros' }, metro: { name: 'Fradique Coutinho', distanceM: 450 } },
  p4: { parking: { name: 'Park Augusta', address: 'R. Augusta, 880 — Consolação' }, metro: { name: 'Paulista', distanceM: 600 } },
  p5: { parking: { name: 'Estacionamento Vila Madalena', address: 'R. Harmonia, 140 — Vila Madalena' }, metro: { name: 'Vila Madalena', distanceM: 390 } },
};

function copyToClipboard(text: string) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    navigator.clipboard?.writeText(text).catch(() => {});
  }
}

const MOCK_EVENTS = [
  { id: 'e1', date: 'Sex, 02 Mai', time: '23:00', title: 'Open Format Night', dj: 'DJ Marquinhos', price: 'R$ 40' },
  { id: 'e2', date: 'Sáb, 03 Mai', time: '22:00', title: 'Techno Session', dj: 'ANNA b Savage', price: 'R$ 80' },
  { id: 'e3', date: 'Sex, 09 Mai', time: '23:00', title: 'House Lovers', dj: 'Djeff', price: 'R$ 50' },
];

export default function PlaceProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'info'>('posts');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [parkingCardOpen, setParkingCardOpen] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState<'address' | 'parking' | null>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const showCopied = (type: 'address' | 'parking') => {
    setCopiedMsg(type);
    setTimeout(() => setCopiedMsg(null), 2000);
  };

  useEffect(() => {
    if (scheduleOpen) {
      slideAnim.setValue(400);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 } as any).start();
    }
  }, [scheduleOpen]);

  const place = MOCK_PLACES.find(item => item.id === id) ?? MOCK_PLACES[0];
  const extras = PLACE_EXTRAS[place.id] ?? {};
  const placePosts = MOCK_POSTS.filter(post => post.placeId === place.id);
  const initials = useMemo(() => getInitials(place.name), [place.name]);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 94 }}>
        <View style={[styles.cover, { paddingTop: insets.top + Spacing.lg }]}>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={() => router.back()} style={styles.circleButton} activeOpacity={0.8}>
              <ChevronLeft color={Colors.white} size={21} strokeWidth={2.4} />
            </TouchableOpacity>
            <View style={styles.topRight}>
              <TouchableOpacity onPress={() => setFollowing(prev => !prev)} style={styles.circleButton} activeOpacity={0.8}>
                <Heart
                  color={following ? Colors.secondary : Colors.white}
                  fill={following ? Colors.secondary : 'transparent'}
                  size={19}
                  strokeWidth={2.2}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.circleButton}
                activeOpacity={0.8}
                onPress={() => Share.share({ message: `${place.name} — ${place.address}. Veja no VYBE!` })}
              >
                <Share2 color={Colors.white} size={18} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.coverInitials}>{initials}</Text>

          <View style={styles.tagsRow}>
            {(place.tags ?? []).slice(0, 3).map(tag => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={[
            styles.body,
            {
              paddingHorizontal: responsive.pagePadding,
              alignItems: 'center',
            },
          ]}
        >
          <View style={[styles.shell, { maxWidth: responsive.contentMaxWidth }]}>
            <View style={styles.identityRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.identityCopy}>
                <Text style={styles.placeName}>{place.name}</Text>
                <View style={styles.addressRow}>
                  <MapPin color={Colors.primaryShade} size={13} strokeWidth={2.3} />
                  <Text style={styles.addressText} numberOfLines={1}>{place.address}</Text>
                  <Text style={styles.dotText}>-</Text>
                  <Text style={styles.addressText}>{place.followers ?? 0} seguidores</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => setFollowing(prev => !prev)}
                style={[styles.followButton, following && styles.followButtonActive]}
                activeOpacity={0.85}
              >
                <Text style={styles.followText}>{following ? 'Seguindo' : '+ Seguir'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.scheduleButton} activeOpacity={0.85} onPress={() => setScheduleOpen(true)}>
                <CalendarDays color={Colors.white} size={17} strokeWidth={2.2} />
                <Text style={styles.scheduleText}>Agenda</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabsRow}>
              <TouchableOpacity style={activeTab === 'posts' ? styles.tabActive : styles.tabInactive} onPress={() => setActiveTab('posts')} activeOpacity={0.8}>
                <Grid2X2 color={activeTab === 'posts' ? Colors.white : Colors.primaryShade} size={20} strokeWidth={2.1} />
              </TouchableOpacity>
              <TouchableOpacity style={activeTab === 'info' ? styles.tabActive : styles.tabInactive} onPress={() => setActiveTab('info')} activeOpacity={0.8}>
                <Info color={activeTab === 'info' ? Colors.white : Colors.primaryShade} size={20} strokeWidth={2.1} />
              </TouchableOpacity>
            </View>

            {activeTab === 'posts' ? (
              <View style={styles.emptyArea}>
                {placePosts.length ? (
                  <View style={styles.postSummary}>
                    <Camera color={Colors.primaryShade} size={34} strokeWidth={1.9} />
                    <Text style={styles.emptyTitle}>{placePosts.length} posts ativos</Text>
                    <Text style={styles.emptyText}>Veja momentos recentes desse lugar no feed.</Text>
                  </View>
                ) : (
                  <>
                    <Camera color={Colors.primaryShade} size={46} strokeWidth={1.8} />
                    <Text style={styles.emptyTitle}>Nenhuma foto ainda</Text>
                    <Text style={styles.emptyText}>Seja o primeiro a postar aqui.</Text>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.infoTab}>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Endereço</Text>
                  <View style={styles.infoRow}>
                    <MapPin color={Colors.secondary} size={15} strokeWidth={2.2} />
                    <Text style={[styles.infoText, { flex: 1 }]}>{place.address}</Text>
                    <TouchableOpacity
                      onPress={() => { copyToClipboard(place.address); showCopied('address'); }}
                      style={styles.copyBtn}
                      activeOpacity={0.7}
                    >
                      {copiedMsg === 'address'
                        ? <Text style={styles.copiedText}>Copiado!</Text>
                        : <Copy color={Colors.textMuted} size={15} strokeWidth={2.2} />
                      }
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.infoBlock}>
                  <Text style={styles.infoLabel}>Categoria</Text>
                  <View style={styles.infoRow}>
                    <Music color={Colors.secondary} size={15} strokeWidth={2.2} />
                    <Text style={styles.infoText}>
                      {place.category === 'club' ? 'Balada' : place.category === 'bar' ? 'Bar' : place.category === 'event' ? 'Evento' : 'Lounge'}
                    </Text>
                  </View>
                </View>
                {place.priceLevel !== undefined && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Preço</Text>
                    <Text style={styles.priceText}>{'$'.repeat(place.priceLevel)}<Text style={styles.priceGhost}>{'$'.repeat(5 - place.priceLevel)}</Text></Text>
                  </View>
                )}
                {place.coverCharge !== undefined && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Entrada</Text>
                    <Text style={styles.infoText}>{place.coverCharge === 0 ? 'Gratuita' : `R$ ${place.coverCharge}`}</Text>
                  </View>
                )}
                {place.crowdLevel !== undefined && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Lotação agora</Text>
                    <View style={styles.crowdRow}>
                      <View style={[styles.crowdDot, {
                        backgroundColor: place.crowdLevel === 'baixo' ? '#22C55E' : place.crowdLevel === 'médio' ? '#F59E0B' : place.crowdLevel === 'alto' ? '#EF4444' : '#FF2D78'
                      }]} />
                      <Text style={styles.infoText}>{place.crowdLevel.charAt(0).toUpperCase() + place.crowdLevel.slice(1)}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.amenitiesGrid}>
                  {extras.metro ? (
                    <View style={[styles.amenityChip, styles.amenityChipActive, styles.amenityChipWide]}>
                      <Text style={styles.amenityText}>🚇 Metrô {extras.metro.name}</Text>
                      <Text style={styles.amenitySubText}>{extras.metro.distanceM}m</Text>
                    </View>
                  ) : (
                    <View style={[styles.amenityChip, place.nearMetro && styles.amenityChipActive]}>
                      <Text style={styles.amenityText}>{place.nearMetro ? '🚇' : '✗'} Metrô</Text>
                    </View>
                  )}
                  {place.hasParking ? (
                    <TouchableOpacity
                      style={[styles.amenityChip, styles.amenityChipActive]}
                      activeOpacity={0.75}
                      onPress={() => setParkingCardOpen(prev => !prev)}
                    >
                      <Text style={styles.amenityText}>🅿️ Estacionamento</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.amenityChip}>
                      <Text style={styles.amenityText}>✗ Estacionamento</Text>
                    </View>
                  )}
                  <View style={[styles.amenityChip, place.hasSeating && styles.amenityChipActive]}>
                    <Text style={styles.amenityText}>{place.hasSeating ? '🪑' : '✗'} Mesas</Text>
                  </View>
                  <View style={[styles.amenityChip, place.hasMenu && styles.amenityChipActive]}>
                    <Text style={styles.amenityText}>{place.hasMenu ? '📋' : '✗'} Cardápio</Text>
                  </View>
                </View>
                {parkingCardOpen && extras.parking && (
                  <TouchableOpacity
                    style={styles.parkingCard}
                    activeOpacity={0.8}
                    onPress={() => { copyToClipboard(extras.parking!.address); showCopied('parking'); }}
                  >
                    <View style={styles.parkingCardLeft}>
                      <Text style={styles.parkingCardName}>{extras.parking.name}</Text>
                      <Text style={styles.parkingCardAddr}>{extras.parking.address}</Text>
                    </View>
                    {copiedMsg === 'parking'
                      ? <Text style={styles.copiedText}>Endereço copiado!</Text>
                      : <Copy color={Colors.textMuted} size={16} strokeWidth={2.2} />
                    }
                  </TouchableOpacity>
                )}
                {(place.tags ?? []).length > 0 && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Tags</Text>
                    <View style={styles.tagsWrap}>
                      {(place.tags ?? []).map(tag => (
                        <View key={tag} style={styles.tagChip}>
                          <Text style={styles.tagChipText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TouchableOpacity
          style={styles.goButton}
          activeOpacity={0.86}
          onPress={() => {
            const query = encodeURIComponent(place.address);
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
          }}
        >
          <LinearGradient
            colors={Colors.gradientBrand}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Navigation color={Colors.white} size={18} strokeWidth={2.3} />
          <Text style={styles.goText}>Ir pra la</Text>
        </TouchableOpacity>
      </View>

      {/* Agenda modal */}
      <Modal visible={scheduleOpen} transparent animationType="none" onRequestClose={() => setScheduleOpen(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.xl, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agenda — {place.name}</Text>
              <TouchableOpacity onPress={() => setScheduleOpen(false)} style={styles.modalClose}>
                <X color={Colors.textMuted} size={20} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
            {MOCK_EVENTS.map(ev => (
              <View key={ev.id} style={styles.eventRow}>
                <View style={styles.eventDateBox}>
                  <Text style={styles.eventDate}>{ev.date.split(',')[0]}</Text>
                  <Text style={styles.eventDay}>{ev.date.split(', ')[1]}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{ev.title}</Text>
                  <View style={styles.eventMeta}>
                    <Music color={Colors.textMuted} size={12} strokeWidth={2} />
                    <Text style={styles.eventMetaText}>{ev.dj}</Text>
                    <Clock color={Colors.textMuted} size={12} strokeWidth={2} />
                    <Text style={styles.eventMetaText}>{ev.time}</Text>
                  </View>
                </View>
                <Text style={styles.eventPrice}>{ev.price}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05050B',
  },
  cover: {
    height: 226,
    backgroundColor: '#1A0F2B',
    overflow: 'hidden',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverInitials: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 70,
    textAlign: 'center',
    fontFamily: FontFamily.heading,
    fontSize: 76,
    color: 'rgba(155,93,229,0.45)',
  },
  tagsRow: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tagPill: {
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.white,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: '#231832',
  },
  shell: {
    width: '100%',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#32184F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['2xl'],
    color: Colors.secondary,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  placeName: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  addressText: {
    flexShrink: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.primaryShade,
  },
  dotText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.primaryShade,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  followButton: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followButtonActive: {
    backgroundColor: Colors.secondaryShade,
  },
  followText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  scheduleButton: {
    flex: 1,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#252138',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  scheduleText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  tabsRow: {
    height: 54,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#252138',
    flexDirection: 'row',
  },
  tabActive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.white,
  },
  tabInactive: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyArea: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  postSummary: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.primaryShade,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: 'rgba(5,5,11,0.96)',
    borderTopWidth: 1,
    borderTopColor: '#252138',
  },
  goButton: {
    height: 56,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  goText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  // Info tab
  infoTab: {
    paddingTop: Spacing.lg,
    gap: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  infoBlock: {
    gap: Spacing.xs,
  },
  infoLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: FontSize.md * 1.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tagChip: {
    height: 28,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(123,47,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(123,47,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagChipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.secondary,
  },
  priceText: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.secondary,
  },
  priceGhost: {
    color: Colors.border,
  },
  crowdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  crowdDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  amenityChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  amenityChipActive: {
    borderColor: 'rgba(255,45,120,0.35)',
    backgroundColor: 'rgba(255,45,120,0.08)',
  },
  amenityChipWide: {
    flexBasis: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amenityText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  amenitySubText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.secondary,
  },
  copyBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  copiedText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.secondary,
  },
  parkingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,0.25)',
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  parkingCardLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  parkingCardName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  parkingCardAddr: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  // Agenda modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
  },
  modalClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  eventDateBox: {
    width: 48,
    alignItems: 'center',
    gap: 2,
  },
  eventDate: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.lg,
    color: Colors.secondary,
  },
  eventDay: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  eventInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  eventTitle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  eventPrice: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.sm,
    color: Colors.gold,
  },
});
