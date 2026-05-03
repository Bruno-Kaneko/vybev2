import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Plus, Search, Store, User, type LucideIcon } from 'lucide-react-native';
import { Colors, FontFamily, Radius, Spacing } from '@/constants';
import { MOCK_CHATS } from '@/constants/MockData';

const CHAT_UNREAD = MOCK_CHATS.reduce((sum, c) => sum + c.unreadCount, 0);

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
    <View style={styles.wrapper}>
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

            const badge = route.name === 'chat' && CHAT_UNREAD > 0 ? CHAT_UNREAD : 0;
            return (
              <TabItem
                key={route.key}
                Icon={iconData.Icon}
                label={iconData.label}
                isFocused={isFocused}
                onPress={onPress}
                badge={badge}
              />
            );
          })}
        </View>
        <View style={{ height: insets.bottom }} />
      </BlurView>
    </View>
  );
}

function TabItem({
  Icon,
  label,
  isFocused,
  onPress,
  badge = 0,
}: {
  Icon: LucideIcon;
  label: string;
  isFocused: boolean;
  onPress: () => void;
  badge?: number;
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
          {badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
            </View>
          )}
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
    zIndex: 100,
    elevation: 100,
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
    alignItems: 'flex-end',
    height: 60,
    paddingHorizontal: Spacing.md,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    paddingBottom: 2,
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
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  badgeText: {
    fontFamily: FontFamily.body,
    fontSize: 9,
    color: Colors.white,
    lineHeight: 14,
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
    height: 60,
    paddingBottom: 4,
  },
  cameraBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
});
