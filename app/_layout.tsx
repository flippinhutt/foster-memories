import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { DatabaseGate } from '@/src/components/DatabaseGate';
import { useTheme } from '@/src/theme';

export default function RootLayout() {
  const colors = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="auto" />
      <DatabaseGate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="pets/new" options={{ title: 'Add pet', presentation: 'modal' }} />
          <Stack.Screen name="pets/[id]/index" options={{ title: '' }} />
          <Stack.Screen name="pets/[id]/edit" options={{ title: 'Edit pet' }} />
        </Stack>
      </DatabaseGate>
    </View>
  );
}
