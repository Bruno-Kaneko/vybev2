import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Plus, Search, Store, User, type LucideIcon } from 'lucide-react-native';
import { Colors, FontFamily, Radius, Spacing } from '@/constants';

const ICONS: Record<string, { Icon: LucideIcon; label: string }> = {
  index: { Icon: Home, label: 'Home' },
  discover: { Icon: Search, label: 'Buscar' },
  camera: { Icon: Plus, label: '' },
  store: { Icon: Store, label: 'Loja' },
  profile: { Icon: User, label: 'Perfil' },
};

export function VybeTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter(route => (descriptors[route.key].options as any).href !== null);

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        <LinearGradient
          colors={['rgba(20,20,32,0.6)', 'rgba(10,10,15,0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tabRow}>
          {visibleRoutes.map(route => {
            const realIndex = state.routes.findIndex(item => item.key === route.key);
            const isFocused = state.index === realIndex;
            const isCamera = route.name === 'camera';
            const iconData = ICONS[route.name];
            if (!iconData) return null;

            const onPress = () => {
              Haptics.selectionAsync();
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            if (isCamera) {
              return <CameraTab key={route.key} onPress={onPress} Icon={iconData.Icon} />;
            }

            return (
              <TabItem
                key={route.key}
                Icon={iconData.Icon}
                label={iconData.label}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

function TabItem({
  Icon,
  label,
  isFocused,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, damping: 5, stiffness: 400 } as any),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 8, stiffness: 300 } as any),
    ]).start();
    onPress();
  };

  const color = isFocused ? Colors.secondary : Colors.textDisabled;

  return (
    <TouchableOpacity onPress={handlePress} style={styles.tab} activeOpacity={1}>
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        <View style={styles.iconWrapper}>
          <Icon color={color} size={23} strokeWidth={isFocused ? 2.6 : 2.1} />
        </View>
        <Text style={[styles.tabLabel, isFocused && { color: Colors.secondary }]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CameraTab({ onPress, Icon }: { onPress: () => void; Icon: LucideIcon }) {
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
          <Icon color={Colors.white} size={30} strokeWidth={2.7} />
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
    alignItems: 'center',
  },
  blur: {
    width: '100%',
    maxWidth: 720,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 62,
    paddingHorizontal: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 62,
  },
  tabInner: {
    minWidth: 54,
    alignItems: 'center',
    gap: 3,
  },
  iconWrapper: {
    position: 'relative',
    width: 28,
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.textDisabled,
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
  cameraTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 62,
    marginBottom: 12,
  },
  cameraBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
});
