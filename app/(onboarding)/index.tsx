import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gift, MapPin, Timer, Users, type LucideIcon } from 'lucide-react-native';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants';
import { BrandLogo, VybeButton } from '@/components/ui';
import { useResponsive } from '@/hooks/useResponsive';

const SLIDES: Array<{
  id: number;
  bg: string;
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  accent: string;
}> = [
  {
    id: 1,
    bg: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=1200&q=90',
    Icon: MapPin,
    title: 'Descubra onde\nesta rolando',
    subtitle: 'Veja em tempo real onde seus amigos e outras pessoas estao curtindo agora.',
    accent: Colors.secondary,
  },
  {
    id: 2,
    bg: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=90',
    Icon: Timer,
    title: 'Posts que\nsomem em horas',
    subtitle: 'Momentos autenticos que desaparecem. Nada fica para sempre; o que importa e agora.',
    accent: Colors.primary,
  },
  {
    id: 3,
    bg: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&q=90',
    Icon: Users,
    title: 'Conheca quem\nesta no mesmo lugar',
    subtitle: 'Estao na mesma festa? Mande mensagem, paquere e faca novos amigos.',
    accent: '#FF6B35',
  },
  {
    id: 4,
    bg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=90',
    Icon: Gift,
    title: 'Ganhe beneficios\nso por aparecer',
    subtitle: 'Poste, curta e acumule pontos. Troque por recompensas reais nos bares parceiros.',
    accent: Colors.gold,
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const responsive = useResponsive();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const isLast = currentIndex === SLIDES.length - 1;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (e: any) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
        setCurrentIndex(idx);
      },
    }
  );

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('vybe_onboarding_seen', 'true');
    router.replace('/(auth)/login');
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * screenWidth, animated: true });
    } else {
      finishOnboarding();
    }
  };

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
          <SlideItem
            key={slide.id}
            slide={slide}
            index={i}
            scrollX={scrollX}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            isWide={!responsive.isPhone}
          />
        ))}
      </ScrollView>

      {/* Logo fixo no canto superior esquerdo */}
      <View style={[styles.logoFixed, { top: insets.top + 16 }]}>
        <BrandLogo width={118} height={38} />
      </View>

      <View
        style={[
          styles.controls,
          {
            paddingBottom: insets.bottom + Spacing.xl,
            paddingHorizontal: responsive.pagePadding,
          },
        ]}
      >
        <View style={[styles.controlsInner, { maxWidth: responsive.formMaxWidth }]}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <DotIndicator
                key={i}
                index={i}
                scrollX={scrollX}
                accent={SLIDES[currentIndex].accent}
                screenWidth={screenWidth}
              />
            ))}
          </View>

          <VybeButton
            label={isLast ? 'Entrar na festa' : 'Proximo'}
            onPress={goNext}
            size="lg"
            fullWidth
            style={{ marginTop: Spacing.lg }}
          />

          <TouchableOpacity
            onPress={finishOnboarding}
            style={[styles.skipButton, isLast && { opacity: 0 }]}
            disabled={isLast}
          >
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function SlideItem({
  slide,
  index,
  scrollX,
  screenWidth,
  screenHeight,
  isWide,
}: {
  slide: typeof SLIDES[0];
  index: number;
  scrollX: Animated.Value;
  screenWidth: number;
  screenHeight: number;
  isWide: boolean;
}) {
  // input range for transitions in/out
  const inputRange = [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth];

  // Background: zoom sutil + pan horizontal lento (parallax depth)
  const bgScale = scrollX.interpolate({
    inputRange,
    outputRange: [1.15, 1, 1.15],
    extrapolate: 'clamp',
  });
  const bgTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [screenWidth * 0.3, 0, -screenWidth * 0.3],
    extrapolate: 'clamp',
  });

  // Icon: entra do topo com bounce + scale
  const iconTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [-80, 0, 80],
    extrapolate: 'clamp',
  });
  const iconScale = scrollX.interpolate({
    inputRange,
    outputRange: [0.3, 1, 0.3],
    extrapolate: 'clamp',
  });
  const iconRotate = scrollX.interpolate({
    inputRange,
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });

  // Title: vem da esquerda
  const titleTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [-60, 0, 60],
    extrapolate: 'clamp',
  });

  // Accent line: vem da direita, atrasado
  const lineTranslateX = scrollX.interpolate({
    inputRange,
    outputRange: [100, 0, -100],
    extrapolate: 'clamp',
  });

  // Subtitle: fade + translateY (mais lento)
  const subtitleTranslateY = scrollX.interpolate({
    inputRange,
    outputRange: [40, 0, -40],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange: [(index - 0.5) * screenWidth, index * screenWidth, (index + 0.5) * screenWidth],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.slide, { width: screenWidth, height: screenHeight }]}>
      {/* Background com pan horizontal (parallax) — move metade da velocidade do foreground */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: bgScale }, { translateX: bgTranslateX }] }]}>
        <Image source={{ uri: slide.bg }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </Animated.View>

      <LinearGradient
        colors={['rgba(10,10,15,0.2)', 'rgba(10,10,15,0.5)', 'rgba(10,10,15,0.95)']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.42, 1]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            maxWidth: isWide ? 620 : undefined,
            paddingHorizontal: isWide ? Spacing['4xl'] : Spacing['3xl'],
            paddingBottom: screenHeight * (isWide ? 0.24 : 0.28),
            opacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconBadge,
            { borderColor: slide.accent, backgroundColor: `${slide.accent}22` },
            { transform: [{ translateY: iconTranslateY }, { scale: iconScale }, { rotate: iconRotate }] },
          ]}
        >
          <slide.Icon color={slide.accent} size={34} strokeWidth={2.4} />
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            isWide && styles.titleWide,
            { transform: [{ translateX: titleTranslateX }] },
          ]}
        >
          {slide.title}
        </Animated.Text>

        <Animated.View
          style={[
            styles.accentLine,
            { backgroundColor: slide.accent },
            { transform: [{ translateX: lineTranslateX }] },
          ]}
        />

        <Animated.Text
          style={[
            styles.subtitle,
            isWide && styles.subtitleWide,
            { transform: [{ translateY: subtitleTranslateY }] },
          ]}
        >
          {slide.subtitle}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

function DotIndicator({
  index,
  scrollX,
  accent,
  screenWidth,
}: {
  index: number;
  scrollX: Animated.Value;
  accent: string;
  screenWidth: number;
}) {
  const width = scrollX.interpolate({
    inputRange: [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth],
    outputRange: [8, 24, 8],
    extrapolate: 'clamp',
  });

  const dotOpacity = scrollX.interpolate({
    inputRange: [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth],
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
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  content: {
    width: '100%',
  },
  logoFixed: {
    position: 'absolute',
    left: Spacing.xl,
    zIndex: 10,
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: FontFamily.heading,
    fontSize: FontSize['4xl'],
    lineHeight: FontSize['4xl'] * 1.15,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  titleWide: {
    fontSize: FontSize['5xl'],
    lineHeight: FontSize['5xl'] * 1.1,
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
  subtitleWide: {
    maxWidth: 520,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlsInner: {
    width: '100%',
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
