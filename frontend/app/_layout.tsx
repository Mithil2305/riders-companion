import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { useTheme } from '../src/hooks/useTheme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { colors, resolvedMode } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="room" />
        <Stack.Screen
          name="settings"
          options={{
            presentation: 'transparentModal',
            animation: 'none',
          }}
        />
        <Stack.Screen name="tracking" />
        <Stack.Screen name="community" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="status" />
        <Stack.Screen
          name="status-viewer"
          options={{
            animation: 'fade',
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
    </>
  );
}
