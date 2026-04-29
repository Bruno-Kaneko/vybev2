import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from '@/hooks/useFonts';
import { Colors } from '@/constants';

export default function RootLayout() {
  const fontsLoaded = useFonts();
  const [fallbackReady, setFallbackReady] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const didRedirect = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => setFallbackReady(true), 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if ((!fontsLoaded && !fallbackReady) || didRedirect.current) {
      return;
    }

    didRedirect.current = true;
    setBootReady(true);
    requestAnimationFrame(() => router.replace('/(onboarding)'));
  }, [fallbackReady, fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Slot />
        {!bootReady && (
          <View style={{ position: 'absolute', inset: 0, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={Colors.secondary} size="large" />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
