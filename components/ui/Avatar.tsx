import React from 'react';
import { Image, View, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
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

  const hasUri = !!uri;

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
          {hasUri ? (
            <Image source={{ uri }} style={{ width: dimension, height: dimension }} />
          ) : (
            <View style={[styles.fallback, { width: dimension, height: dimension }]}>
              <User color={Colors.textMuted} size={dimension * 0.5} strokeWidth={1.8} />
            </View>
          )}
        </View>
      </View>
    );
  }

  if (!hasUri) {
    return (
      <View
        style={[
          styles.fallback,
          { width: dimension, height: dimension, borderRadius: dimension / 2 } as ViewStyle,
          style,
        ]}
      >
        <User color={Colors.textMuted} size={dimension * 0.5} strokeWidth={1.8} />
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

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
