import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuth } from '@/context/AuthContext';
import { savePushToken } from '@/lib/db';

// Configura como notificações foreground se comportam (uma vez, fora do componente)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || Platform.OS === 'web') return;

    let mounted = true;
    register(user.id).catch(() => {});

    // Listener: usuário toca em uma notificação → navega pra tela correta
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      if (!mounted) return;
      const data = response.notification.request.content.data as Record<string, string>;
      if (!data) return;
      if (data.type === 'message' && data.otherId) {
        router.navigate(`/(tabs)/chat/${data.otherId}` as any);
      } else if (data.type === 'follow' && data.userId) {
        router.push(`/profile/${data.userId}` as any);
      } else if (data.type === 'reaction' && data.postId) {
        router.push(`/post/${data.postId}` as any);
      }
    });

    return () => { mounted = false; sub.remove(); };
  }, [user?.id]);
}

async function register(userId: string) {
  // Push notifications só funcionam em devices reais (não em simuladores). Tentamos
  // mesmo assim; se falhar, o try/catch externo silencia.
  try {
    // Pede permissão (se já tem, mantém)
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    // Pega o projectId do EAS (vem do app.json → extra.eas.projectId)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants.easConfig as any)?.projectId;

    if (!projectId) {
      if (__DEV__) console.warn('[push] sem projectId no EAS — token não vai funcionar em build standalone');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    await savePushToken(userId, tokenData.data, Platform.OS);

    // Android: cria canal default (precisa pro app aparecer com som/vibração)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'VYBE',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF2D78',
        sound: 'default',
      });
    }
  } catch (e) {
    if (__DEV__) console.warn('[push] erro ao registrar:', e);
  }
}
