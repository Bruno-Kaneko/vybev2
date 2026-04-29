import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from '@/hooks/useFonts';
import { Colors } from '@/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export default function RootLayout() {
  const fontsLoaded = useFonts();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setChecked(true), 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!fontsLoaded && !checked) return;

    let mounted = true;

    async function checkOnboarding() {
      try {
        const seen = await AsyncStorage.getItem('onboarding_complete');
        if (!seen) {
          router.replace('/(onboarding)');
        } else {
          router.replace('/(auth)/login');
        }
      } catch {
        router.replace('/(onboarding)');
      } finally {
        if (mounted) setChecked(true);
      }
    }

    checkOnboarding();
    return () => {
      mounted = false;
    };
  }, [fontsLoaded, checked]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.background} />
        <Slot />
        {!checked && (
          <View style={{ position: 'absolute', inset: 0, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={Colors.secondary} size="large" />
          </View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
