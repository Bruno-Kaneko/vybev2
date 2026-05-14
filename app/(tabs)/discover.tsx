import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  Beer,
  Camera,
  Grid2X2,
  List,
  Map,
  MapPin,
  Music,
  Search,
  Sparkles,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { useResponsive } from '@/hooks/useResponsive';
import PlaceMap from '@/components/ui/PlaceMap';
import { Skeleton } from '@/components/ui';
import { getActivePostLocations, searchPostsByPlace, searchUsers, getPlaces, mapDBPlaceToPlace } from '@/lib/db';
import type { DBUserResult } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { Place } from '@/types';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Category = 'Todos' | 'Balada' | 'Bar' | 'Evento' | 'Lounge';
type ViewMode = 'list' | 'map';
type SearchMode = 'lugares' | 'pessoas';

const CATEGORIES: Array<{ label: Category; Icon: LucideIcon }> = [
  { label: 'Todos', Icon: Grid2X2 },
  { label: 'Balada', Icon: Music },
  { label: 'Bar', Icon: Beer },
  { label: 'Evento', Icon: Ticket },
  { label: 'Lounge', Icon: Sparkles },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { user: authUser } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Todos');
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [heatPoints, setHeatPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [realResults, setRealResults] = useState<Array<{ place_name: string; lat: number; lng: number; count: number }>>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>('lugares');
  const [userResults, setUserResults] = useState<DBUserResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('recentUserSearches').then(v => {
      if (v) setRecentSearches(JSON.parse(v));
    }).catch(() => {});
  }, []);

  const saveRecentSearch = useCallback((query: string) => {
    if (!query) return;
    setRecentSearches(prev => {
      const next = [query, ...prev.filter(s => s !== query)].slice(0, 15);
      AsyncStorage.setItem('recentUserSearches', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const loadHeatPoints = useCallback(async () => {
    try {
      const pts = await getActivePostLocations();
      setHeatPoints(pts);
    } catch {}
  }, []);

  useEffect(() => { loadHeatPoints(); }, [loadHeatPoints]);

  // Real-time: heatmap atualiza quando alguém posta ou um post expira
  useEffect(() => {
    const channel = supabase
      .channel('discover_heatmap')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadHeatPoints();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadHeatPoints]);

  const loadPlaces = useCallback(async () => {
    try {
      const rows = await getPlaces();
      setPlaces(rows.map(mapDBPlaceToPlace));
    } catch {}
    finally { setPlacesLoading(false); }
  }, []);

  // Carrega lugares reais do banco (vindos do Google Places)
  useEffect(() => { loadPlaces(); }, [loadPlaces]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadPlaces(), loadHeatPoints()]);
    setRefreshing(false);
  }, [loadPlaces, loadHeatPoints]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!search.trim()) { setRealResults([]); setUserResults([]); return; }
    if (searchMode === 'pessoas') {
      const query = search.trim().replace(/^@/, '');
      searchTimeout.current = setTimeout(() => {
        searchUsers(query)
          .then(results => setUserResults(results.filter(u => u.id !== authUser?.id)))
          .catch(() => {});
      }, 350);
    } else {
      searchTimeout.current = setTimeout(() => {
        searchPostsByPlace(search.trim()).then(setRealResults).catch(() => {});
      }, 350);
    }
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search, searchMode, authUser?.id]);

  const filtered = useMemo(() => {
    return places.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        activeCategory === 'Todos' ||
        (activeCategory === 'Balada' && p.category === 'club') ||
        (activeCategory === 'Bar' && p.category === 'bar') ||
        (activeCategory === 'Evento' && p.category === 'event') ||
        (activeCategory === 'Lounge' && p.category === 'lounge');
      const matchPrice = priceFilter === null || p.priceLevel === priceFilter;
      const matchNeighborhood = !neighborhoodFilter || p.neighborhood === neighborhoodFilter;
      const matchMetro = !amenities.has('metro') || p.nearMetro;
      const matchParking = !amenities.has('parking') || p.hasParking;
      const matchSeating = !amenities.has('seating') || p.hasSeating;
      return matchSearch && matchCat && matchPrice && matchNeighborhood && matchMetro && matchParking && matchSeating;
    });
  }, [places, activeCategory, search, priceFilter, neighborhoodFilter, amenities]);

  // Bairros únicos (ordenados, ignora os mal-formados que começam com número)
  const neighborhoods = useMemo(() => {
    const set = new Set<string>();
    for (const p of places) {
      if (p.neighborhood && !/^\d/.test(p.neighborhood)) set.add(p.neighborhood);
    }
    return [...set].sort();
  }, [places]);

  // Map mode
  if (viewMode === 'map') {
    return (
      <View style={styles.root}>
        <PlaceMap
          places={filtered}
          onSelect={place => setSelectedPlace(place)}
          heatPoints={heatPoints}
        />

        {/* Floating top bar */}
        <View style={[styles.mapTopBar, { top: insets.top + Spacing.md }]}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <Text style={styles.mapTopTitle}>{filtered.length} lugares</Text>
          <TouchableOpacity
            style={styles.viewTogglePill}
            onPress={() => setViewMode('list')}
            activeOpacity={0.8}
          >
            <List color={Colors.white} size={14} strokeWidth={2.2} />
            <Text style={styles.viewToggleText}>Lista</Text>
          </TouchableOpacity>
        </View>

        {/* Selected place card */}
        {selectedPlace && (
          <TouchableOpacity
            style={[styles.selectedCard, { bottom: insets.bottom + 106 }]}
            activeOpacity={0.9}
            onPress={() => {
              router.push({ pathname: '/place/[id]', params: { id: selectedPlace.id } });
              setSelectedPlace(null);
            }}
          >
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.selectedCardInner}>
              {selectedPlace.thumbnail ? (
                <Image source={{ uri: selectedPlace.thumbnail }} style={styles.selectedThumb} />
              ) : (
                <View style={[styles.selectedThumb, styles.selectedThumbFallback]}>
                  <Map color={Colors.textMuted} size={18} />
                </View>
              )}
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName} numberOfLines={1}>{selectedPlace.name}</Text>
                <Text style={styles.selectedAddr} numberOfLines={1}>{selectedPlace.address}</Text>
                <View style={styles.selectedStats}>
                  <Users color={Colors.textMuted} size={12} strokeWidth={2} />
                  <Text style={styles.selectedStat}>{selectedPlace.activeUsers} pessoas agora</Text>
                </View>
              </View>
              <View style={styles.selectedArrow}>
                <Text style={styles.selectedArrowText}>›</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.selectedClose}
              onPress={e => { e.stopPropagation(); setSelectedPlace(null); }}
            >
              <X color={Colors.textMuted} size={16} strokeWidth={2.5} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // List mode
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        key={responsive.columns}
        data={searchMode === 'pessoas' ? [] : filtered}
        numColumns={responsive.columns}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.secondary}
            colors={[Colors.secondary]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingHorizontal: responsive.pagePadding,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        columnWrapperStyle={responsive.columns > 1 ? [styles.columnWrapper, { maxWidth: responsive.contentMaxWidth, alignSelf: 'center' as const }] : undefined}
        ListHeaderComponent={
          <DiscoverHeader
            search={search}
            setSearch={setSearch}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            count={filtered.length}
            maxWidth={responsive.contentMaxWidth}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            neighborhoodFilter={neighborhoodFilter}
            setNeighborhoodFilter={setNeighborhoodFilter}
            neighborhoods={neighborhoods}
            amenities={amenities}
            setAmenities={setAmenities}
            viewMode={viewMode}
            setViewMode={setViewMode}
            realResults={realResults}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            userResults={userResults}
            recentSearches={recentSearches}
            onUserPress={(userId, query) => { saveRecentSearch(query); router.push(`/profile/${userId}`); }}
          />
        }
        ListEmptyComponent={
          placesLoading && searchMode === 'lugares' ? (
            <View style={{ width: '100%', maxWidth: responsive.contentMaxWidth, gap: Spacing.md, paddingTop: Spacing.md }}>
              {[0, 1, 2, 3, 4].map(i => (
                <View key={i} style={{ flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.sm }}>
                  <Skeleton width={110} height={110} borderRadius={12} />
                  <View style={{ flex: 1, gap: 6, paddingVertical: Spacing.sm }}>
                    <Skeleton width="70%" height={16} borderRadius={6} />
                    <Skeleton width="40%" height={12} borderRadius={5} />
                    <Skeleton width="85%" height={11} borderRadius={5} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { maxWidth: responsive.contentMaxWidth }]}>
              <Search color={Colors.textMuted} size={32} strokeWidth={2} />
              <Text style={styles.emptyTitle}>
                {searchMode === 'pessoas' ? 'Nenhum usuário encontrado' : 'Nenhum lugar encontrado'}
              </Text>
              <Text style={styles.emptyText}>
                {searchMode === 'pessoas' ? 'Tente outro nome ou username.' : 'Tente outro filtro ou uma busca mais curta.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <PlaceCard place={item} columns={responsive.columns} maxWidth={responsive.contentMaxWidth} />
        )}
      />
    </View>
  );
}

function DiscoverHeader({
  search,
  setSearch,
  activeCategory,
  setActiveCategory,
  count,
  maxWidth,
  priceFilter,
  setPriceFilter,
  neighborhoodFilter,
  setNeighborhoodFilter,
  neighborhoods,
  amenities,
  setAmenities,
  viewMode,
  setViewMode,
  realResults,
  searchMode,
  setSearchMode,
  userResults,
  recentSearches,
  onUserPress,
}: {
  search: string;
  setSearch: (value: string) => void;
  activeCategory: Category;
  setActiveCategory: (value: Category) => void;
  count: number;
  maxWidth: number;
  priceFilter: number | null;
  setPriceFilter: (value: number | null) => void;
  neighborhoodFilter: string | null;
  setNeighborhoodFilter: (value: string | null) => void;
  neighborhoods: string[];
  amenities: Set<string>;
  setAmenities: (fn: (prev: Set<string>) => Set<string>) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  realResults: Array<{ place_name: string; lat: number; lng: number; count: number }>;
  searchMode: SearchMode;
  setSearchMode: (m: SearchMode) => void;
  userResults: DBUserResult[];
  recentSearches: string[];
  onUserPress: (userId: string, query: string) => void;
}) {
  return (
    <View style={[styles.headerShell, { maxWidth }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Buscar</Text>
          <Text style={styles.subtitle}>O que ta rolando agora</Text>
        </View>
        {/* View mode toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.8}
          >
            <List color={viewMode === 'list' ? Colors.white : Colors.textMuted} size={15} strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'map' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('map')}
            activeOpacity={0.8}
          >
            <Map color={viewMode === 'map' ? Colors.white : Colors.textMuted} size={15} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, searchMode === 'lugares' && styles.modeBtnActive]}
          onPress={() => setSearchMode('lugares')}
          activeOpacity={0.8}
        >
          <MapPin color={searchMode === 'lugares' ? Colors.white : Colors.textMuted} size={13} strokeWidth={2.2} />
          <Text style={[styles.modeBtnText, searchMode === 'lugares' && styles.modeBtnTextActive]}>Lugares</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, searchMode === 'pessoas' && styles.modeBtnActive]}
          onPress={() => setSearchMode('pessoas')}
          activeOpacity={0.8}
        >
          <Users color={searchMode === 'pessoas' ? Colors.white : Colors.textMuted} size={13} strokeWidth={2.2} />
          <Text style={[styles.modeBtnText, searchMode === 'pessoas' && styles.modeBtnTextActive]}>Pessoas</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrapper}>
        <Search color={Colors.textMuted} size={18} strokeWidth={2} />
        <TextInput
          placeholder={searchMode === 'pessoas' ? 'Buscar usuários...' : 'Buscar lugares...'}
          placeholderTextColor={Colors.textDisabled}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
        />
      </View>

      {/* User results */}
      {searchMode === 'pessoas' && userResults.length > 0 && (
        <View style={styles.userResultsSection}>
          {userResults.map(u => (
            <TouchableOpacity
              key={u.id}
              style={styles.userRow}
              onPress={() => onUserPress(u.id, search.trim().replace(/^@/, ''))}
              activeOpacity={0.8}
            >
              <View style={styles.userAvatar}>
                {u.avatar_url ? (
                  <Image source={{ uri: u.avatar_url }} style={styles.userAvatarImg} />
                ) : (
                  <View style={[styles.userAvatarImg, styles.userAvatarFallback]}>
                    <Text style={styles.userAvatarInitial}>
                      {(u.display_name ?? u.username)[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userDisplayName}>{u.display_name ?? u.username}</Text>
                <Text style={styles.userUsername}>@{u.username}</Text>
              </View>
              <Text style={styles.userFollowers}>{u.follower_count} seguidores</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {searchMode === 'pessoas' && !search.trim() && (
        <>
          {recentSearches.length > 0 ? (
            <View style={styles.recentSection}>
              <Text style={styles.recentLabel}>Buscas recentes</Text>
              {recentSearches.map(q => (
                <TouchableOpacity
                  key={q}
                  style={styles.recentRow}
                  onPress={() => setSearch(q)}
                  activeOpacity={0.75}
                >
                  <Search color={Colors.textMuted} size={15} strokeWidth={2} />
                  <Text style={styles.recentText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.pessoasHint}>
              <Users color={Colors.textMuted} size={32} strokeWidth={1.8} />
              <Text style={styles.pessoasHintText}>Busque por nome ou @username</Text>
            </View>
          )}
        </>
      )}

      {searchMode === 'lugares' && <>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={item => item.label}
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesList}
          contentContainerStyle={styles.categoriesRow}
          renderItem={({ item }) => {
            const selected = activeCategory === item.label;
            return (
              <TouchableOpacity
                onPress={() => setActiveCategory(item.label)}
                style={[styles.categoryPill, selected && styles.categoryPillActive]}
                activeOpacity={0.8}
              >
                <item.Icon color={selected ? Colors.white : Colors.textMuted} size={15} strokeWidth={2.2} />
                <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Neighborhood filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 40, flexGrow: 0, marginBottom: Spacing.sm }} contentContainerStyle={{ alignItems: 'center', gap: Spacing.sm, paddingRight: Spacing.xl }}>
          <TouchableOpacity
            onPress={() => setNeighborhoodFilter(null)}
            style={[styles.categoryPill, neighborhoodFilter === null && styles.categoryPillActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.categoryText, neighborhoodFilter === null && styles.categoryTextActive]}>Todos bairros</Text>
          </TouchableOpacity>
          {neighborhoods.map(n => (
            <TouchableOpacity
              key={n}
              onPress={() => setNeighborhoodFilter(neighborhoodFilter === n ? null : n)}
              style={[styles.categoryPill, neighborhoodFilter === n && styles.categoryPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryText, neighborhoodFilter === n && styles.categoryTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Price filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 40, flexGrow: 0, marginBottom: Spacing.sm }} contentContainerStyle={{ alignItems: 'center', gap: Spacing.sm, paddingRight: Spacing.xl }}>
          {([null, 1, 2, 3, 4, 5] as Array<number | null>).map(p => (
            <TouchableOpacity
              key={String(p)}
              onPress={() => setPriceFilter(priceFilter === p ? null : p)}
              style={[styles.categoryPill, priceFilter === p && styles.categoryPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryText, priceFilter === p && styles.categoryTextActive]}>
                {p === null ? 'Todos preços' : '$'.repeat(p)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Amenity toggles */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' }}>
          {[
            { key: 'metro', label: '🚇 Metrô perto' },
            { key: 'parking', label: '🅿️ Estacionamento' },
            { key: 'seating', label: '🪑 Lugar p/ sentar' },
          ].map(item => {
            const active = amenities.has(item.key);
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => {
                  setAmenities(prev => {
                    const next = new Set(prev);
                    active ? next.delete(item.key) : next.add(item.key);
                    return next;
                  });
                }}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {realResults.length > 0 && (
          <View style={styles.realResultsSection}>
            <Text style={styles.realResultsLabel}>Posts ativos</Text>
            {realResults.map(r => (
              <View key={r.place_name} style={styles.realResultRow}>
                <MapPin color={Colors.secondary} size={14} strokeWidth={2.2} />
                <Text style={styles.realResultName} numberOfLines={1}>{r.place_name}</Text>
                <Text style={styles.realResultCount}>{r.count} {r.count === 1 ? 'post' : 'posts'}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>{count} lugares encontrados</Text>
      </>}
    </View>
  );
}

function PulsingDot() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  return <Animated.View style={[styles.liveDot, { transform: [{ scale }], opacity }]} />;
}

function PlaceCard({ place, columns, maxWidth }: { place: Place; columns: number; maxWidth: number }) {
  const categoryLabel: Record<Place['category'], string> = {
    club: 'Balada',
    bar: 'Bar',
    event: 'Evento',
    lounge: 'Lounge',
  };

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/place/[id]', params: { id: place.id } })}
      style={[
        styles.placeCard,
        columns === 1 ? { width: '100%' } : styles.placeCardGrid,
      ]}
      activeOpacity={0.85}
    >
      {place.thumbnail ? (
        <Image source={{ uri: place.thumbnail }} style={styles.placeThumb} />
      ) : (
        <View style={[styles.placeThumb, styles.placeThumbFallback]}>
          <Map color={Colors.textMuted} size={26} strokeWidth={2} />
        </View>
      )}
      <View style={styles.placeInfo}>
        <View style={styles.placeTopRow}>
          <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
          <View style={styles.liveBadge}>
            <PulsingDot />
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
        </View>
        <Text style={styles.placeCategory}>{categoryLabel[place.category]}</Text>
        <Text style={styles.placeAddress} numberOfLines={1}>{place.address}</Text>
        <View style={styles.placeStats}>
          <View style={styles.placeStatItem}>
            <Users color={Colors.textMuted} size={14} strokeWidth={2} />
            <Text style={styles.placeStat}>{place.activeUsers} pessoas</Text>
          </View>
          <View style={styles.placeStatItem}>
            <Camera color={Colors.textMuted} size={14} strokeWidth={2} />
            <Text style={styles.placeStat}>{place.activePosts} posts</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    gap: 3,
    marginBottom: Spacing.md,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  modeBtnActive: {
    backgroundColor: Colors.secondary,
  },
  modeBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  modeBtnTextActive: {
    color: Colors.white,
  },
  userResultsSection: {
    gap: 2,
    marginBottom: Spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    flexShrink: 0,
  },
  userAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userAvatarFallback: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitial: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.lg,
    color: Colors.secondary,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userDisplayName: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  userUsername: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  userFollowers: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flexShrink: 0,
  },
  pessoasHint: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    gap: Spacing.md,
  },
  pessoasHintText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  recentSection: {
    gap: 2,
    marginBottom: Spacing.md,
  },
  recentLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recentText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  mapRoot: {
    position: 'relative' as any,
  },
  listContent: {
    width: '100%',
  },
  headerShell: {
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  header: {
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['3xl'],
    color: Colors.white,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    gap: 2,
    marginTop: Spacing.sm,
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBtnActive: {
    backgroundColor: Colors.secondary,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    height: 48,
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  realResultsSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  realResultsLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  realResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  realResultName: {
    flex: 1,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  realResultCount: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  categoriesList: {
    height: 42,
    flexGrow: 0,
    marginBottom: Spacing.lg,
  },
  categoriesRow: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
  },
  categoryPill: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryPillActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  categoryText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  categoryTextActive: {
    color: Colors.white,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  columnWrapper: {
    width: '100%',
    maxWidth: 1120,
    gap: Spacing.md,
  },
  placeCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    minHeight: 110,
  },
  placeCardGrid: {
    flex: 1,
  },
  placeThumb: {
    width: 112,
    minHeight: 110,
    backgroundColor: Colors.surfaceElevated,
  },
  placeThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeInfo: {
    flex: 1,
    minWidth: 0,
    padding: Spacing.md,
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  placeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  placeName: {
    flex: 1,
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 45, 120, 0.15)',
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.secondary,
  },
  liveText: {
    fontFamily: FontFamily.mono,
    fontSize: 8,
    color: Colors.secondary,
    letterSpacing: 1,
  },
  placeCategory: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.secondary,
  },
  placeAddress: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
  },
  placeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  placeStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeStat: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  emptyState: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  emptyText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  // Map mode
  mapTopBar: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    height: 46,
    borderRadius: Radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapTopTitle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  viewTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.secondary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  viewToggleText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.white,
  },
  selectedCard: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    paddingRight: Spacing['2xl'] + 16,
  },
  selectedThumb: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    flexShrink: 0,
  },
  selectedThumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  selectedName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.md,
    color: Colors.white,
  },
  selectedAddr: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  selectedStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  selectedStat: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  selectedArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  selectedArrowText: {
    color: Colors.white,
    fontSize: 18,
    lineHeight: 22,
  },
  selectedClose: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
