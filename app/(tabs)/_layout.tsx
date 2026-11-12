import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { useTheme, type ThemeColors } from '@/src/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName, colors: ThemeColors) {
  return function TabIcon({ focused, size }: { focused: boolean; size: number }) {
    return <Ionicons name={name} color={focused ? colors.primary : colors.textMuted} size={size} />;
  };
}

export default function TabsLayout() {
  const colors = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home-outline', colors) }} />
      <Tabs.Screen name="pets" options={{ title: 'Pets', tabBarIcon: tabIcon('paw-outline', colors) }} />
      <Tabs.Screen
        name="add-memory"
        options={{ title: 'Add Memory', tabBarIcon: tabIcon('add-circle', colors), tabBarAccessibilityLabel: 'Add memory' }}
      />
      <Tabs.Screen name="collections" options={{ title: 'Collections', tabBarIcon: tabIcon('albums-outline', colors) }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: tabIcon('settings-outline', colors) }} />
    </Tabs>
  );
}
