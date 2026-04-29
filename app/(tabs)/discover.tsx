import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { MOCK_PLACES } from '@/constants/MockData';
import type { Place } from '@/types';

const { width: W } = Dimensions.get('window');
const CATEGORIES = ['Todos', 'Balada', 'Bar', 'Evento', 'Lounge'];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  const filtered = MOCK_PLACES.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat =
      activeCategory === 'Todos' ||
      (activeCategory === 'Balada' && p.category === 'club') ||
      (activeCategory === 'Bar' && p.category === 'bar') ||
      (activeCategory === 'Evento' && p.category === 'event') ||
      (activeCategory === 'Lounge' && p.category === 'lounge');
    return matchSearch && matchCat;
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Descobrir</Text>
        <Text style={styles.subtitle}>O que está rolando em SP agora 🔥</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder="Buscar lugares..."
          placeholderTextColor={Colors.textDisabled}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
        style={styles.categoriesScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
          >
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapText}>Mapa interativo</Text>
        <Text style={styles.mapSub}>Integração com Google Maps em breve</Text>
      </View>

      {/* Places list */}
      <ScrollView
        style={styles.placesList}
        contentContainerStyle={{ paddingBottom: insets.bottom + 90, paddingHorizontal: Spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{filtered.length} lugares encontrados</Text>
        {filtered.map((place, i) => (
          <View key={place.id}>
            <PlaceCard place={place} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function PlaceCard({ place }: { place: Place }) {
  const categoryLabel: Record<Place['category'], string> = {
    club: '🎵 Balada',
    bar: '🍺 Bar',
    event: '🎪 Evento',
    lounge: '✨ Lounge',
  };

  return (
    <TouchableOpacity style={styles.placeCard} activeOpacity={0.85}>
      {place.thumbnail ? (
        <Image source={{ uri: place.thumbnail }} style={styles.placeThumb} />
      ) : (
        <View style={[styles.placeThumb, { backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 28 }}>🏠</Text>
        </View>
      )}
      <View style={styles.placeInfo}>
        <View style={styles.placeTopRow}>
          <Text style={styles.placeName}>{place.name}</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
        </View>
        <Text style={styles.placeCategory}>{categoryLabel[place.category]}</Text>
        <Text style={styles.placeAddress} numberOfLines={1}>{place.address}</Text>
        <View style={styles.placeStats}>
          <Text style={styles.placeStat}>👥 {place.activeUsers} pessoas</Text>
          <Text style={styles.placeStat}>📸 {place.activePosts} posts</Text>
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
  header: {
    paddingHorizontal: Spacing.xl,
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
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    height: 46,
    gap: Spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  categoriesScroll: {
    marginBottom: Spacing.md,
  },
  categoriesRow: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
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
    marginHorizontal: Spacing.xl,
    height: 150,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapEmoji: {
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  mapText: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.lg,
    color: Colors.white,
    marginBottom: 4,
  },
  mapSub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  placesList: {
    flex: 1,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    height: 100,
  },
  placeThumb: {
    width: 100,
    height: '100%',
  },
  placeInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  placeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeName: {
    fontFamily: FontFamily.headingMedium,
    fontSize: FontSize.md,
    color: Colors.white,
    flex: 1,
    marginRight: Spacing.sm,
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
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  placeAddress: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.xs,
    color: Colors.textDisabled,
  },
  placeStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  placeStat: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
});
