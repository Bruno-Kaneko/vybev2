import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { savePushToken } from '@/lib/db';

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;
    register(user.id);
    return setupListeners();
  }, [user?.id]);
}

async function register(userId: string) {
  try {
    const Notifications = await import('expo-notifications');
    const Constants = (await import('expo-constants')).default;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    await savePushToken(userId, tokenData.data, Platform.OS);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'VYBE',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF2D78',
      });
    }
  } catch {
    // Push não suportado neste ambiente (simulador, web, etc.)
  }
}

function setupListeners(): (() => void) | undefined {
  let sub: any;
  import('expo-notifications').then(Notifications => {
    // Toque na notificação → navega para a tela correta
    sub = Notifications.addNotificationResponseReceivedListener(response => {
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
  }).catch(() => {});

  return () => { sub?.remove?.(); };
}
