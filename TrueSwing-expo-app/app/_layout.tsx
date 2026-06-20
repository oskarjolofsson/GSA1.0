import '../global.css';
import { Stack } from 'expo-router';
import { AuthProvider } from 'features/auth/AuthProvider';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConnectivityProvider } from 'features/shared/connectivity/ConnectivityContext';
import OfflineBanner from 'features/shared/components/OfflineBanner';

export default function RootLayout() {
  return (
    // Required by react-native-gesture-handler v2 — without it, Gesture.Pan() in features/scrubber doesn't fire.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={DarkTheme}>
          {/* Connectivity wraps auth so public (sign-in) and app screens both see it. */}
          <ConnectivityProvider>
            <AuthProvider>
              <Stack>
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
                <Stack.Screen name="(public)" options={{ headerShown: false }} />
              </Stack>
              {/* Rendered after the Stack as an absolute overlay so it floats over
                  content instead of pushing it down; renders null when online. */}
              <OfflineBanner />
            </AuthProvider>
          </ConnectivityProvider>
          <StatusBar style="light" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
