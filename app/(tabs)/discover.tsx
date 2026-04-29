import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  Beer,
  Camera,
  Grid2X2,
  Map,
  Music,
  Search,
  Sparkles,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_PLACES } from '@/constants/MockData';
import { useResponsive } from '@/hooks/useResponsive';
import type { Place } from '@/types';

type Category = 'Todos' | 'Balada' | 'Bar' | 'Evento' | 'Lounge';

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
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Todos');

  const filtered = useMemo(() => {
    return MOCK_PLACES.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        activeCategory === 'Todos' ||
        (activeCategory === 'Balada' && p.category === 'club') ||
        (activeCategory === 'Bar' && p.category === 'bar') ||
        (activeCategory === 'Evento' && p.category === 'event') ||
        (activeCategory === 'Lounge' && p.category === 'lounge');
      return matchSearch && matchCat;
    });
  }, [activeCategory, search]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        key={responsive.columns}
        data={filtered}
        numColumns={responsive.columns}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { maxWidth: responsive.contentMaxWidth }]}>
            <Search color={Colors.textMuted} size={32} strokeWidth={2} />
            <Text style={styles.emptyTitle}>Nenhum lugar encontrado</Text>
            <Text style={styles.emptyText}>Tente outro filtro ou uma busca mais curta.</Text>
          </View>
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
}: {
  search: string;
  setSearch: (value: string) => void;
  activeCategory: Category;
  setActiveCategory: (value: Category) => void;
  count: number;
  maxWidth: number;
}) {
  return (
    <View style={[styles.headerShell, { maxWidth }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        <Text style={styles.subtitle}>O que ta rolando agora</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Search color={Colors.textMuted} size={18} strokeWidth={2} />
        <TextInput
          placeholder="Buscar lugares..."
          placeholderTextColor={Colors.textDisabled}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
        />
      </View>

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

      <View style={styles.mapPlaceholder}>
        <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
        <Map color={Colors.secondary} size={38} strokeWidth={1.9} />
        <Text style={styles.mapText}>Mapa interativo</Text>
        <Text style={styles.mapSub}>Integracao com Google Maps em breve</Text>
      </View>

      <Text style={styles.sectionLabel}>{count} lugares encontrados</Text>
    </View>
  );
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
            <View style={styles.liveDot} />
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
  listContent: {
    width: '100%',
  },
  headerShell: {
    width: '100%',
    alignSelf: 'center',
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
  mapPlaceholder: {
    height: 156,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  mapText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  mapSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
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
});
