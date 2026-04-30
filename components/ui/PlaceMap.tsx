import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import type { Place } from '@/types';

export default function PlaceMap({
  places,
  onSelect,
  style,
}: {
  places: Place[];
  onSelect: (place: Place) => void;
  style?: any;
}) {
  return (
    <View style={[styles.container, style]}>
      <MapPin color={Colors.secondary} size={48} strokeWidth={1.6} />
      <Text style={styles.title}>Mapa disponível no app</Text>
      <Text style={styles.sub}>
        Baixe o app para ver os {places.length} lugares no mapa em tempo real
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: Spacing.md,
    padding: Spacing['2xl'],
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.xl,
    color: Colors.white,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: FontSize.sm * 1.55,
  },
});
