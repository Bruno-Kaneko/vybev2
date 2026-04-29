import React, { useEffect, useRef, useState } from 'react';
import { Text, View, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants';
import { getTimeRemaining } from '@/types';

interface Props {
  expiresAt: number;
  compact?: boolean;
}

export function PostTimer({ expiresAt, compact }: Props) {
  const [timeInfo, setTimeInfo] = useState(() => getTimeRemaining(expiresAt));
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInfo(getTimeRemaining(expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }

    if (timeInfo.isUrgent && !timeInfo.isExpired) {
      const anim = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseScale, { toValue: 1.12, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulseScale, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, { toValue: 0.6, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulseOpacity, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
        ])
      );
      animRef.current = anim;
      anim.start();
    } else {
      Animated.spring(pulseScale, { toValue: 1, useNativeDriver: true }).start();
      Animated.spring(pulseOpacity, { toValue: 1, useNativeDriver: true }).start();
    }

    return () => {
      if (animRef.current) {
        animRef.current.stop();
      }
    };
  }, [timeInfo.isUrgent, timeInfo.isExpired]);

  const isUrgent = timeInfo.isUrgent && !timeInfo.isExpired;
  const color = isUrgent ? Colors.urgent : Colors.textMuted;
  const bgColor = isUrgent ? Colors.urgentGlow : 'rgba(255,255,255,0.1)';

  if (timeInfo.isExpired) return null;

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }, { transform: [{ scale: pulseScale }] }]}>
      <Animated.View style={[styles.dot, { backgroundColor: isUrgent ? Colors.urgent : Colors.secondary }, { opacity: pulseOpacity }]} />
      <Text style={[styles.label, { color }]}>
        {timeInfo.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: FontFamily.mono,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
});
