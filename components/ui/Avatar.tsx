import React from 'react';
import { Image, View, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '@/constants';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 88,
};

interface Props {
  uri: string;
  size?: AvatarSize;
  withGradientBorder?: boolean;
  style?: ViewStyle;
}

export function Avatar({ uri, size = 'md', withGradientBorder, style }: Props) {
  const dimension = SIZES[size];
  const borderSize = withGradientBorder ? 2.5 : 0;

  if (withGradientBorder) {
    return (
      <View style={[{ width: dimension + borderSize * 2, height: dimension + borderSize * 2 }, style]}>
        <LinearGradient
          colors={Colors.gradientBrand}
          style={[StyleSheet.absoluteFill, { borderRadius: (dimension + borderSize * 2) / 2 }]}
        />
        <View
          style={{
            position: 'absolute',
            top: borderSize,
            left: borderSize,
            borderRadius: dimension / 2,
            overflow: 'hidden',
            width: dimension,
            height: dimension,
          }}
        >
          <Image source={{ uri }} style={{ width: dimension, height: dimension }} />
        </View>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[{ width: dimension, height: dimension, borderRadius: dimension / 2 } as ImageStyle]}
    />
  );
}
