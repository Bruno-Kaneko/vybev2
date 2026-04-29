import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { VybeButton } from '@/components/ui';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    bg: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&q=90',
    emoji: '📍',
    title: 'Descubra onde\nestá rolando',
    subtitle: 'Veja em tempo real onde seus amigos e outras pessoas estão curtindo agora.',
    accent: Colors.secondary,
  },
  {
    id: 2,
    bg: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=90',
    emoji: '⏳',
    title: 'Posts que\nsomem em horas',
    subtitle: 'Momentos autênticos que desaparecem. Nada fica pra sempre — o que importa é agora.',
    accent: Colors.primary,
  },
  {
    id: 3,
    bg: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=90',
    emoji: '🔥',
    title: 'Conheça quem\nestá no mesmo lugar',
    subtitle: 'Estão na mesma festa? Mande mensagem, paquere, faça novos amigos.',
    accent: '#FF6B35',
  },
  {
    id: 4,
    bg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=90',
    emoji: '🍹',
    title: 'Ganhe drinks\nsó por aparecer',
    subtitle: 'Poste, curta e acumule pontos. Troque por drinks reais nos bares parceiros.',
    accent: Colors.gold,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (e: any) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setCurrentIndex(idx);
      },
    }
  );

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * SCREEN_WIDTH, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboarding_complete', '1');
    router.replace('/(auth)/login');
  };

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        style={StyleSheet.absoluteFill}
      >
        {SLIDES.map((slide, i) => (
          <SlideItem key={slide.id} slide={slide} index={i} scrollX={scrollX} />
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <DotIndicator key={i} index={i} scrollX={scrollX} accent={SLIDES[currentIndex].accent} />
          ))}
        </View>

        <VybeButton
          label={isLast ? 'Entrar na festa 🎉' : 'Próximo'}
          onPress={goNext}
          size="lg"
          fullWidth
          style={{ marginTop: Spacing.lg }}
        />

        {!isLast && (
          <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function SlideItem({ slide, index, scrollX }: { slide: typeof SLIDES[0]; index: number; scrollX: Animated.Value }) {
  const scale = scrollX.interpolate({
    inputRange: [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
    outputRange: [1.08, 1, 1.08],
    extrapolate: 'clamp',
  });

  const translateY = scrollX.interpolate({
    inputRange: [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
    outputRange: [30, 0, -30],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange: [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.slide}>
      {/* Background image with parallax */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
        <Image source={{ uri: slide.bg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </Animated.View>

      {/* Dark overlay */}
      <LinearGradient
        colors={['rgba(10,10,15,0.2)', 'rgba(10,10,15,0.5)', 'rgba(10,10,15,0.95)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.4, 1]}
      />

      {/* Content */}
      <Animated.View style={[styles.content, { transform: [{ translateY }], opacity }]}>
        {/* Logo */}
        <Text style={styles.logo}>VYBE</Text>

        <Text style={styles.emoji}>{slide.emoji}</Text>

        <Text style={[styles.title, { color: Colors.white }]}>{slide.title}</Text>

        <View style={[styles.accentLine, { backgroundColor: slide.accent }]} />

        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

function DotIndicator({ index, scrollX, accent }: { index: number; scrollX: Animated.Value; accent: string }) {
  const width = scrollX.interpolate({
    inputRange: [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
    outputRange: [8, 24, 8],
    extrapolate: 'clamp',
  });

  const dotOpacity = scrollX.interpolate({
    inputRange: [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
    outputRange: [0.4, 1, 0.4],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.dot, { backgroundColor: accent, width, opacity: dotOpacity }]} />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: Spacing['3xl'],
    paddingBottom: SCREEN_HEIGHT * 0.28,
  },
  logo: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    letterSpacing: 6,
    marginBottom: Spacing['3xl'],
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['4xl'],
    lineHeight: FontSize['4xl'] * 1.15,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  accentLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    lineHeight: FontSize.lg * 1.55,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing['3xl'],
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    height: 8,
    borderRadius: Radius.full,
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  skipText: {
    fontFamily: FontFamily.body,
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
});
