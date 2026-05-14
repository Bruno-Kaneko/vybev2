import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Linking,
  Modal, Animated, Platform, Image, RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarDays, Camera, ChevronLeft, Clock, Copy, Grid2X2,
  Heart, Info, MapPin, Music, Navigation, Radio, Share2, X,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants';
import { Skeleton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';
import { useAuth } from '@/context/AuthContext';
import {
  getPlace, getPlaceActivePosts, submitPlaceReport,
  isFollowingPlace, followPlace, unfollowPlace, mapDBPlaceToPlace,
  getPlaceFollowerCount,
} from '@/lib/db';
import type { DBPlace } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { CrowdLevel, Place, Post, QueueLevel, VibeType } from '@/types';

const MOCK_EVENTS = [
  { id: 'e1', date: 'Sex, 02 Mai', time: '23:00', title: 'Open Format Night', dj: 'DJ Marquinhos', price: 'R$ 40' },
  { id: 'e2', date: 'Sáb, 03 Mai', time: '22:00', title: 'Techno Session', dj: 'ANNA b Savage', price: 'R$ 80' },
  { id: 'e3', date: 'Sex, 09 Mai', time: '23:00', title: 'House Lovers', dj: 'Djeff', price: 'R$ 50' },
];

function copyToClipboard(text: string) {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    navigator.clipboard?.writeText(text).catch(() => {});
  }
}

export default function PlaceProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realPlace, setRealPlace] = useState<DBPlace | null>(null);
  const [realPosts, setRealPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'info'>('posts');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [metroPopup, setMetroPopup] = useState(false);
  const [parkingPopup, setParkingPopup] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState<'address' | 'parking' | null>(null);
  const [reportedAt, setReportedAt] = useState<number | null>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const reportSlideAnim = useRef(new Animated.Value(500)).current;

  // Place vem 100% do banco (mapeado via helper compartilhado)
  const place: Place | null = realPlace ? mapDBPlaceToPlace(realPlace) : null;

  // Extras de metrô/estacionamento (campos opcionais do schema rico)
  const extras = useMemo(() => {
    if (!realPlace) return {} as { metro?: { name: string; distanceM: number }; parking?: { name: string; address: string } };
    return {
      metro: realPlace.metro_name ? { name: realPlace.metro_name, distanceM: realPlace.metro_distance_m ?? 0 } : undefined,
      parking: realPlace.parking_name ? { name: realPlace.parking_name, address: realPlace.parking_address ?? '' } : undefined,
    };
  }, [realPlace]);

  const [liveCrowd, setLiveCrowd] = useState<CrowdLevel | undefined>(undefined);
  const [liveQueue, setLiveQueue] = useState<QueueLevel | undefined>(undefined);
  const [liveVibe, setLiveVibe] = useState<VibeType | undefined>(undefined);
  const [draftCrowd, setDraftCrowd] = useState<CrowdLevel | undefined>(undefined);
  const [draftQueue, setDraftQueue] = useState<QueueLevel | undefined>(undefined);
  const [draftVibe, setDraftVibe] = useState<VibeType | undefined>(undefined);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      // Carrega o place primeiro pra ter o uuid interno (pode receber uuid ou google_place_id na URL)
      const p = await getPlace(id);
      if (!p) { setLoading(false); return; }
      const [posts, isFollowing, count] = await Promise.all([
        getPlaceActivePosts(p.id),
        authUser ? isFollowingPlace(authUser.id, p.id) : Promise.resolve(false),
        getPlaceFollowerCount(p.id),
      ]);
      setRealPlace(p);
      setLiveCrowd((p.crowd_level as CrowdLevel) ?? undefined);
      setLiveQueue((p.queue_level as QueueLevel) ?? undefined);
      setLiveVibe((p.vibe as VibeType) ?? undefined);
      setDraftCrowd((p.crowd_level as CrowdLevel) ?? undefined);
      setDraftQueue((p.queue_level as QueueLevel) ?? undefined);
      setDraftVibe((p.vibe as VibeType) ?? undefined);
      setRealPosts(posts);
      setFollowing(isFollowing);
      setFollowerCount(count);
    } catch {} finally {
      setLoading(false);
    }
  }, [id, authUser?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Real-time: atualiza contador de seguidores quando qualquer pessoa segue/deixa de seguir este lugar
  useEffect(() => {
    if (!realPlace) return;
    const channel = supabase
      .channel(`place_follows:${realPlace.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'place_follows', filter: `place_id=eq.${realPlace.id}` },
        () => {
          getPlaceFollowerCount(realPlace.id).then(setFollowerCount).catch(() => {});
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [realPlace?.id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    if (scheduleOpen) {
      slideAnim.setValue(400);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 } as any).start();
    }
  }, [scheduleOpen]);

  useEffect(() => {
    if (reportOpen) {
      setDraftCrowd(liveCrowd);
      setDraftQueue(liveQueue);
      setDraftVibe(liveVibe);
      reportSlideAnim.setValue(500);
      Animated.spring(reportSlideAnim, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 } as any).start();
    }
  }, [reportOpen]);

  const canReport = !reportedAt || Date.now() - reportedAt > 30 * 60 * 1000;

  const submitReport = async () => {
    setLiveCrowd(draftCrowd);
    setLiveQueue(draftQueue);
    setLiveVibe(draftVibe);
    setReportedAt(Date.now());
    setReportOpen(false);
    if (realPlace && authUser && draftCrowd && draftQueue && draftVibe) {
      submitPlaceReport(realPlace.id, authUser.id, draftCrowd, draftQueue, draftVibe).catch(() => {});
    }
  };

  const handleFollow = async () => {
    if (!realPlace || !authUser) return;
    const next = !following;
    // Optimistic: muda UI imediatamente; subscription corrige se houver erro
    setFollowing(next);
    setFollowerCount(c => Math.max(0, c + (next ? 1 : -1)));
    setFollowLoading(true);
    try {
      if (next) await followPlace(authUser.id, realPlace.id);
      else await unfollowPlace(authUser.id, realPlace.id);
    } catch {
      setFollowing(!next);
      setFollowerCount(c => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setFollowLoading(false);
    }
  };

  const showCopied = (type: 'address' | 'parking') => {
    setCopiedMsg(type);
    setTimeout(() => setCopiedMsg(null), 2000);
  };

  const initials = useMemo(() => place ? getInitials(place.name) : '', [place?.name]);
  const postsToShow = realPosts;

  // Skeleton while loading real place
  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: Colors.background }]}>
        <View style={[styles.topActions, { paddingTop: insets.top + Spacing.sm }]} pointerEvents="box-none">
          <TouchableOpacity onPress={() => router.back()} style={styles.circleButton} activeOpacity={0.8}>
            <ChevronLeft color={Colors.white} size={21} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
        <Skeleton width="100%" height={226} borderRadius={0} />
        <View style={{ padding: Spacing.xl, gap: Spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
            <Skeleton width={76} height={76} borderRadius={38} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="60%" height={18} borderRadius={8} />
              <Skeleton width="80%" height={12} borderRadius={6} />
            </View>
          </View>
          <Skeleton width="100%" height={44} borderRadius={12} />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            {[0, 1, 2].map(i => <Skeleton key={i} width="31%" height={100} borderRadius={10} />)}
          </View>
        </View>
      </View>
    );
  }

  // Lugar não encontrado no banco
  if (!place) {
    return (
      <View style={[styles.root, { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, gap: Spacing.md }]}>
        <View style={[styles.topActions, { paddingTop: insets.top + Spacing.sm }]} pointerEvents="box-none">
          <TouchableOpacity onPress={() => router.back()} style={styles.circleButton} activeOpacity={0.8}>
            <ChevronLeft color={Colors.white} size={21} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
        <MapPin color={Colors.textMuted} size={48} strokeWidth={1.5} />
        <Text style={{ fontFamily: FontFamily.heading, fontSize: FontSize.xl, color: Colors.white }}>Lugar não encontrado</Text>
        <Text style={{ fontFamily: FontFamily.body, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' }}>
          Esse lugar não está mais disponível no nosso catálogo.
        </Text>
      </View>
    );
  }

  const thumbGap = Spacing.xs;
  const contentWidth = Math.min(responsive.contentMaxWidth, responsive.width - responsive.pagePadding * 2);
  const thumbSize = (contentWidth - thumbGap * 2) / 3;

  return (
    <View style={styles.root}>
      <View style={[styles.topActions, { paddingTop: insets.top + Spacing.sm }]} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} style={styles.circleButton} activeOpacity={0.8}>
          <ChevronLeft color={Colors.white} size={21} strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={styles.topRight}>
          <TouchableOpacity onPress={handleFollow} style={styles.circleButton} activeOpacity={0.8} disabled={followLoading}>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 94 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.secondary}
            colors={[Colors.secondary]}
          />
        }
      >
        <View style={[styles.cover, { paddingTop: insets.top + Spacing.lg }]}>
          {place.thumbnail ? (
            <>
              <Image source={{ uri: place.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(5,5,11,0.85)']}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            <Text style={styles.coverInitials}>{initials}</Text>
          )}
          <View style={styles.tagsRow}>
            {(place.tags ?? []).slice(0, 3).map(tag => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.body, { paddingHorizontal: responsive.pagePadding, alignItems: 'center' }]}>
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
                  <Text style={styles.dotText}>·</Text>
                  <Text style={styles.addressText}>{followerCount} seguidores</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={handleFollow}
                style={[styles.followButton, following && styles.followButtonActive]}
                activeOpacity={0.85}
                disabled={followLoading}
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
              postsToShow.length > 0 ? (
                <View style={[styles.postsGrid, { gap: thumbGap }]}>
                  {postsToShow.map(post => (
                    <TouchableOpacity
                      key={post.id}
                      style={{ width: thumbSize, height: thumbSize * 1.28, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.surface }}
                      onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: post.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <LinearGradient colors={['transparent', 'rgba(10,10,15,0.65)']} style={StyleSheet.absoluteFill} />
                      <View style={{ position: 'absolute', left: 5, right: 5, bottom: 5, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <MapPin color={Colors.textMuted} size={10} strokeWidth={2.2} />
                        <Text style={{ flex: 1, fontFamily: FontFamily.body, fontSize: 9, color: Colors.textMuted }} numberOfLines={1}>{post.user.displayName}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyArea}>
                  <Camera color={Colors.primaryShade} size={46} strokeWidth={1.8} />
                  <Text style={styles.emptyTitle}>Nenhuma foto ainda</Text>
                  <Text style={styles.emptyText}>Seja o primeiro a postar aqui.</Text>
                </View>
              )
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
                    <Text style={styles.priceText}>
                      {'$'.repeat(place.priceLevel)}
                      <Text style={styles.priceGhost}>{'$'.repeat(5 - place.priceLevel)}</Text>
                    </Text>
                  </View>
                )}
                {place.coverCharge !== undefined && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Entrada</Text>
                    <Text style={styles.infoText}>{place.coverCharge === 0 ? 'Gratuita' : `R$ ${place.coverCharge}`}</Text>
                  </View>
                )}
                {liveCrowd && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Lotação agora</Text>
                    <View style={styles.crowdRow}>
                      <View style={[styles.crowdDot, {
                        backgroundColor: liveCrowd === 'baixo' ? '#22C55E' : liveCrowd === 'médio' ? '#F59E0B' : liveCrowd === 'alto' ? '#EF4444' : '#FF2D78'
                      }]} />
                      <Text style={styles.infoText}>{liveCrowd.charAt(0).toUpperCase() + liveCrowd.slice(1)}</Text>
                    </View>
                  </View>
                )}
                {liveQueue && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Fila agora</Text>
                    <Text style={styles.infoText}>{liveQueue.charAt(0).toUpperCase() + liveQueue.slice(1)}</Text>
                  </View>
                )}
                {liveVibe && (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Vibe</Text>
                    <Text style={styles.infoText}>{liveVibe.charAt(0).toUpperCase() + liveVibe.slice(1)}</Text>
                  </View>
                )}
                <View style={styles.amenitiesGrid}>
                  <TouchableOpacity
                    style={[styles.amenityChip, place.nearMetro && styles.amenityChipActive]}
                    activeOpacity={0.75}
                    onPress={() => setMetroPopup(true)}
                  >
                    <Text style={styles.amenityText}>{place.nearMetro ? '🚇' : '✗'} Metrô</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.amenityChip, place.hasParking && styles.amenityChipActive]}
                    activeOpacity={0.75}
                    onPress={() => setParkingPopup(true)}
                  >
                    <Text style={styles.amenityText}>{place.hasParking ? '🅿️' : '✗'} Estacionamento</Text>
                  </TouchableOpacity>
                  <View style={[styles.amenityChip, place.hasSeating && styles.amenityChipActive]}>
                    <Text style={styles.amenityText}>{place.hasSeating ? '🪑' : '✗'} Mesas</Text>
                  </View>
                  <View style={[styles.amenityChip, place.hasMenu && styles.amenityChipActive]}>
                    <Text style={styles.amenityText}>{place.hasMenu ? '📋' : '✗'} Cardápio</Text>
                  </View>
                </View>
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
        {reportedAt && (
          <Text style={styles.reportedMsg}>
            ✓ Report enviado · {canReport ? 'pode reportar de novo' : 'próximo em 30 min'}
          </Text>
        )}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={[styles.reportButton, !canReport && { opacity: 0.45 }]}
            activeOpacity={0.86}
            onPress={() => canReport && setReportOpen(true)}
          >
            <Radio color={Colors.secondary} size={17} strokeWidth={2.2} />
            <Text style={styles.reportText}>Reportar</Text>
          </TouchableOpacity>
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
            <Text style={styles.goText}>Ir pra lá</Text>
          </TouchableOpacity>
        </View>
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

      {/* Metro popup */}
      <Modal visible={metroPopup} transparent animationType="fade" onRequestClose={() => setMetroPopup(false)}>
        <TouchableOpacity style={styles.popupOverlay} activeOpacity={1} onPress={() => setMetroPopup(false)}>
          <View style={styles.popupCard}>
            <Text style={styles.popupEmoji}>🚇</Text>
            <Text style={styles.popupTitle}>Metrô mais próximo</Text>
            {extras.metro ? (
              <>
                <Text style={styles.popupMain}>{extras.metro.name}</Text>
                <Text style={styles.popupSub}>{extras.metro.distanceM} metros de distância</Text>
              </>
            ) : place.nearMetro ? (
              <Text style={styles.popupSub}>Metrô próximo a este local</Text>
            ) : (
              <Text style={styles.popupSub}>Sem metrô próximo a este local</Text>
            )}
            <TouchableOpacity style={styles.popupBtn} onPress={() => setMetroPopup(false)}>
              <Text style={styles.popupBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Parking popup */}
      <Modal visible={parkingPopup} transparent animationType="fade" onRequestClose={() => setParkingPopup(false)}>
        <TouchableOpacity style={styles.popupOverlay} activeOpacity={1} onPress={() => setParkingPopup(false)}>
          <View style={styles.popupCard}>
            <Text style={styles.popupEmoji}>🅿️</Text>
            <Text style={styles.popupTitle}>Estacionamento mais próximo</Text>
            {extras.parking ? (
              <>
                <Text style={styles.popupMain}>{extras.parking.name}</Text>
                <Text style={styles.popupSub}>{extras.parking.address}</Text>
                <TouchableOpacity
                  style={styles.popupCopyBtn}
                  activeOpacity={0.8}
                  onPress={() => { copyToClipboard(extras.parking!.address); showCopied('parking'); }}
                >
                  <Copy color={Colors.white} size={15} strokeWidth={2.2} />
                  <Text style={styles.popupCopyText}>
                    {copiedMsg === 'parking' ? 'Endereço copiado!' : 'Copiar endereço'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.popupSub}>
                {place.hasParking ? 'Estacionamento disponível próximo' : 'Sem estacionamento próximo a este local'}
              </Text>
            )}
            <TouchableOpacity style={[styles.popupBtn, { marginTop: Spacing.xs }]} onPress={() => setParkingPopup(false)}>
              <Text style={styles.popupBtnText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report modal */}
      <Modal visible={reportOpen} transparent animationType="none" onRequestClose={() => setReportOpen(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.reportSheet, { paddingBottom: insets.bottom + Spacing.xl, transform: [{ translateY: reportSlideAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reportar agora</Text>
              <TouchableOpacity onPress={() => setReportOpen(false)} style={styles.modalClose}>
                <X color={Colors.textMuted} size={20} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.reportSectionLabel}>Lotação</Text>
            <View style={styles.reportChips}>
              {(['baixo', 'médio', 'alto', 'lotado'] as CrowdLevel[]).map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.reportChip, draftCrowd === val && styles.reportChipActive]}
                  onPress={() => setDraftCrowd(val)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.chipDot, {
                    backgroundColor: val === 'baixo' ? '#22C55E' : val === 'médio' ? '#F59E0B' : val === 'alto' ? '#EF4444' : '#FF2D78'
                  }]} />
                  <Text style={[styles.reportChipText, draftCrowd === val && styles.reportChipTextActive]}>
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.reportSectionLabel}>Fila</Text>
            <View style={styles.reportChips}>
              {(['sem fila', 'curta', 'longa'] as QueueLevel[]).map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.reportChip, draftQueue === val && styles.reportChipActive]}
                  onPress={() => setDraftQueue(val)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.reportChipText, draftQueue === val && styles.reportChipTextActive]}>
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.reportSectionLabel}>Vibe</Text>
            <View style={styles.reportChips}>
              {(['resenha', 'paquera', 'misto'] as VibeType[]).map(val => (
                <TouchableOpacity
                  key={val}
                  style={[styles.reportChip, draftVibe === val && styles.reportChipActive]}
                  onPress={() => setDraftVibe(val)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.reportChipText, draftVibe === val && styles.reportChipTextActive]}>
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.reportSubmit} activeOpacity={0.85} onPress={submitReport}>
              <Text style={styles.reportSubmitText}>Confirmar report</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05050B' },
  cover: { height: 226, backgroundColor: '#1A0F2B', overflow: 'hidden' },
  topActions: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  circleButton: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center',
  },
  coverInitials: {
    position: 'absolute', left: 0, right: 0, bottom: 70, textAlign: 'center',
    fontFamily: FontFamily.heading, fontSize: 76, color: 'rgba(155,93,229,0.45)',
  },
  tagsRow: {
    position: 'absolute', right: Spacing.lg, bottom: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
  },
  tagPill: {
    height: 26, borderRadius: Radius.full, backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: Spacing.md, alignItems: 'center', justifyContent: 'center',
  },
  tagText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, color: Colors.white },
  body: { borderTopWidth: 1, borderTopColor: '#231832' },
  shell: { width: '100%' },
  identityRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingTop: Spacing.lg, paddingBottom: Spacing.lg,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#32184F', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: FontFamily.heading, fontSize: FontSize['2xl'], color: Colors.secondary },
  identityCopy: { flex: 1, minWidth: 0 },
  placeName: { fontFamily: FontFamily.heading, fontSize: FontSize.xl, color: Colors.white },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  addressText: { flexShrink: 1, fontFamily: FontFamily.body, fontSize: FontSize.xs, color: Colors.primaryShade },
  dotText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, color: Colors.primaryShade },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: Spacing.md },
  followButton: {
    flex: 1, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  followButtonActive: { backgroundColor: Colors.secondaryShade },
  followText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.white },
  scheduleButton: {
    flex: 1, height: 44, borderRadius: Radius.md, borderWidth: 1, borderColor: '#252138',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  },
  scheduleText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.white },
  tabsRow: {
    height: 54, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: '#252138', flexDirection: 'row',
  },
  tabActive: { flex: 1, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: Colors.white },
  tabInactive: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: Spacing.md },
  emptyArea: { minHeight: 360, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.md, color: Colors.white },
  emptyText: { fontFamily: FontFamily.body, fontSize: FontSize.sm, color: Colors.primaryShade, textAlign: 'center' },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm,
    backgroundColor: 'rgba(5,5,11,0.96)', borderTopWidth: 1, borderTopColor: '#252138',
  },
  reportedMsg: {
    fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs,
    color: '#22C55E', textAlign: 'center', marginBottom: Spacing.xs,
  },
  bottomRow: { flexDirection: 'row', gap: Spacing.sm },
  reportButton: {
    height: 56, paddingHorizontal: Spacing.lg, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: 'rgba(255,45,120,0.4)', backgroundColor: 'rgba(255,45,120,0.08)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  },
  reportText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.secondary },
  goButton: {
    flex: 1, height: 56, borderRadius: Radius.lg, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  goText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.md, color: Colors.white },
  infoTab: { paddingTop: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing['2xl'] },
  infoBlock: { gap: Spacing.xs },
  infoLabel: {
    fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1,
  },
  infoText: { fontFamily: FontFamily.body, fontSize: FontSize.md, color: Colors.text, lineHeight: FontSize.md * 1.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tagChip: {
    height: 28, borderRadius: Radius.full, paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(123,47,255,0.15)', borderWidth: 1,
    borderColor: 'rgba(123,47,255,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  tagChipText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs, color: Colors.secondary },
  priceText: { fontFamily: FontFamily.heading, fontSize: FontSize.xl, color: Colors.secondary },
  priceGhost: { color: Colors.border },
  crowdRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  crowdDot: { width: 10, height: 10, borderRadius: 5 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  amenityChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  amenityChipActive: { borderColor: 'rgba(255,45,120,0.35)', backgroundColor: 'rgba(255,45,120,0.08)' },
  amenityText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs, color: Colors.textMuted },
  copyBtn: { padding: Spacing.xs, marginLeft: Spacing.xs },
  copiedText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs, color: Colors.secondary },
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl, paddingTop: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontFamily: FontFamily.heading, fontSize: FontSize.xl, color: Colors.white },
  modalClose: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md,
  },
  eventDateBox: { width: 48, alignItems: 'center', gap: 2 },
  eventDate: { fontFamily: FontFamily.heading, fontSize: FontSize.lg, color: Colors.secondary },
  eventDay: { fontFamily: FontFamily.body, fontSize: FontSize.xs, color: Colors.textMuted },
  eventInfo: { flex: 1, minWidth: 0, gap: 4 },
  eventTitle: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.md, color: Colors.white },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventMetaText: { fontFamily: FontFamily.body, fontSize: FontSize.xs, color: Colors.textMuted },
  eventPrice: { fontFamily: FontFamily.heading, fontSize: FontSize.sm, color: Colors.gold },
  popupOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'],
  },
  popupCard: {
    width: '100%', maxWidth: 320, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing['2xl'], alignItems: 'center', gap: Spacing.sm,
  },
  popupEmoji: { fontSize: 36 },
  popupTitle: {
    fontFamily: FontFamily.bodyMedium, fontSize: FontSize.xs,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1,
  },
  popupMain: { fontFamily: FontFamily.heading, fontSize: FontSize.xl, color: Colors.white, textAlign: 'center' },
  popupSub: { fontFamily: FontFamily.body, fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  popupCopyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.secondary, borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, marginTop: Spacing.sm,
    shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 10,
  },
  popupCopyText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.white },
  popupBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl },
  popupBtnText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textMuted },
  reportSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl, paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl, gap: Spacing.md,
  },
  reportSectionLabel: {
    fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.xs,
  },
  reportChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  reportChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  reportChipActive: { borderColor: Colors.secondary, backgroundColor: 'rgba(255,45,120,0.12)' },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  reportChipText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textMuted },
  reportChipTextActive: { color: Colors.secondary },
  reportSubmit: {
    height: 52, borderRadius: Radius.lg, backgroundColor: Colors.secondary,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm,
    shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  reportSubmitText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.md, color: Colors.white },
});
