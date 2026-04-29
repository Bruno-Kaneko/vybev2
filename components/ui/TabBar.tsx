import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants';
import { Badge } from './Badge';

const ICONS: Record<string, { active: string; inactive: string; label: string }> = {
  index: { active: '🏠', inactive: '🏠', label: 'Home' },
  discover: { active: '🗺️', inactive: '🗺️', label: 'Descobrir' },
  camera: { active: '📷', inactive: '📷', label: '' },
  chat: { active: '💬', inactive: '💬', label: 'Chat' },
  store: { active: '🏪', inactive: '🏪', label: 'Loja' },
};

export function VybeTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        <LinearGradient
          colors={['rgba(20,20,32,0.6)', 'rgba(10,10,15,0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const isCamera = route.name === 'camera';
            const iconData = ICONS[route.name] ?? { active: '●', inactive: '○', label: route.name };

            const onPress = () => {
              Haptics.selectionAsync();
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            if (isCamera) {
              return <CameraTab key={route.key} onPress={onPress} />;
            }

            return (
              <TabItem
                key={route.key}
                icon={isFocused ? iconData.active : iconData.inactive}
                label={iconData.label}
                isFocused={isFocused}
                onPress={onPress}
                badge={route.name === 'chat' ? 2 : 0}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function TabItem({ icon, label, isFocused, onPress, badge }: { icon: string; label: string; isFocused: boolean; onPress: () => void; badge?: number }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, damping: 5, stiffness: 400 } as any),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 300 } as any),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.tab} activeOpacity={1}>
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        <View style={styles.iconWrapper}>
          <Text style={styles.tabIcon}>{icon}</Text>
          {badge ? (
            <View style={styles.badgeWrapper}>
              <Badge count={badge} />
            </View>
          ) : null}
        </View>
        {label ? (
          <Text style={[styles.tabLabel, isFocused && { color: Colors.secondary }]}>
            {label}
          </Text>
        ) : null}
        {isFocused && <View style={styles.activeDot} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

function CameraTab({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, damping: 5, stiffness: 400 } as any),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 300 } as any),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.cameraTab} activeOpacity={1}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={Colors.gradientBrand}
          style={styles.cameraBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.cameraIcon}>+</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  blur: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  tabInner: {
    alignItems: 'center',
    gap: 2,
  },
  iconWrapper: {
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.textDisabled,
    letterSpacing: 0.3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  badgeWrapper: {
    position: 'absolute',
    top: -4,
    right: -8,
  },
  cameraTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 12,
  },
  cameraBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  cameraIcon: {
    fontFamily: FontFamily.heading,
    fontSize: 28,
    color: Colors.white,
    lineHeight: 32,
    marginTop: -2,
  },
});
