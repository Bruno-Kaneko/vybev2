import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const SIZE_STYLES: Record<Size, { height: number; fontSize: number; paddingHorizontal: number }> = {
  sm: { height: 36, fontSize: FontSize.sm, paddingHorizontal: Spacing.md },
  md: { height: 48, fontSize: FontSize.md, paddingHorizontal: Spacing.xl },
  lg: { height: 56, fontSize: FontSize.lg, paddingHorizontal: Spacing['2xl'] },
};

export function VybeButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
  textStyle,
  fullWidth,
}: Props) {
  const sizeStyle = SIZE_STYLES[size];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const containerStyle: ViewStyle = {
    height: sizeStyle.height,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    width: fullWidth ? '100%' : undefined,
  };

  const labelStyle: TextStyle = {
    fontFamily: FontFamily.bodyMedium,
    fontSize: sizeStyle.fontSize,
    letterSpacing: 0.3,
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        style={[{ opacity: disabled ? 0.5 : 1 }, style]}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={Colors.gradientBrand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[containerStyle, { paddingHorizontal: sizeStyle.paddingHorizontal }]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <Text style={[labelStyle, { color: Colors.white }, textStyle]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const outlineStyles: ViewStyle = {
    borderWidth: 1.5,
    borderColor: variant === 'danger' ? Colors.urgent : Colors.secondary,
    paddingHorizontal: sizeStyle.paddingHorizontal,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        containerStyle,
        variant !== 'ghost' ? outlineStyles : { paddingHorizontal: sizeStyle.paddingHorizontal },
        { opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.secondary} size="small" />
      ) : (
        <Text
          style={[
            labelStyle,
            { color: variant === 'danger' ? Colors.urgent : variant === 'ghost' ? Colors.textMuted : Colors.secondary },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
