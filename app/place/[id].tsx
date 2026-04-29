import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  Grid2X2,
  Heart,
  Info,
  MapPin,
  Navigation,
  Share2,
} from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants';
import { MOCK_PLACES, MOCK_POSTS } from '@/constants/MockData';
import { useResponsive } from '@/hooks/useResponsive';

export default function PlaceProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const [following, setFollowing] = useState(false);
  const place = MOCK_PLACES.find(item => item.id === id) ?? MOCK_PLACES[0];
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
              <TouchableOpacity style={styles.circleButton} activeOpacity={0.8}>
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
              <TouchableOpacity style={styles.scheduleButton} activeOpacity={0.85}>
                <CalendarDays color={Colors.white} size={17} strokeWidth={2.2} />
                <Text style={styles.scheduleText}>Agenda</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabsRow}>
              <View style={styles.tabActive}>
                <Grid2X2 color={Colors.white} size={20} strokeWidth={2.1} />
              </View>
              <View style={styles.tabInactive}>
                <Info color={Colors.primaryShade} size={20} strokeWidth={2.1} />
              </View>
            </View>

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
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TouchableOpacity style={styles.goButton} activeOpacity={0.86}>
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
});
