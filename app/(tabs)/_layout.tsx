import { Tabs } from 'expo-router';
import { VybeTabBar } from '@/components/ui/TabBar';
import { Colors } from '@/constants';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={props => <VybeTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Descobrir' }} />
      <Tabs.Screen name="camera" options={{ title: 'Postar' }} />
      <Tabs.Screen name="chat/index" options={{ title: 'Chat' }} />
      <Tabs.Screen name="store" options={{ title: 'Loja' }} />
    </Tabs>
  );
}
