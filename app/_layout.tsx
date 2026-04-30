import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from '@/hooks/useFonts';
import { Colors } from '@/constants';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function RootNavigator() {
  const fontsLoaded = useFonts();
  const { session, loading: authLoading } = useAuth();
  const [fontTimeout, setFontTimeout] = useState(false);
  const didRedirect = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setFontTimeout(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const fontsReady = fontsLoaded || fontTimeout;

  useEffect(() => {
    if (!fontsReady || authLoading || didRedirect.current) return;

    didRedirect.current = true;
    requestAnimationFrame(() => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(onboarding)');
      }
    });
  }, [fontsReady, authLoading, session]);

  const ready = fontsReady && !authLoading;

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.background} />
      <Slot />
      {!ready && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.secondary} size="large" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
