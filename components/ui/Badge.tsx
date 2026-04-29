import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Radius } from '@/constants';

interface Props {
  count: number;
  max?: number;
}

export function Badge({ count, max = 99 }: Props) {
  if (count === 0) return null;
  const label = count > max ? `${max}+` : String(count);
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  text: {
    fontFamily: FontFamily.mono,
    fontSize: 10,
    color: Colors.white,
    lineHeight: 14,
  },
});
