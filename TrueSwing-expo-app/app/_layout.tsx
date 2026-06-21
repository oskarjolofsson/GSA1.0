import '../global.css';
import { Stack } from 'expo-router';
import { AuthProvider } from 'features/auth/AuthProvider';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConnectivityProvider } from 'features/shared/connectivity/ConnectivityContext';
import OfflineBanner from 'features/shared/components/OfflineBanner';
import { useFonts } from 'expo-font';
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_900Black,
} from '@expo-google-fonts/fraunces';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
} from '@expo-google-fonts/hanken-grotesk';

export default function RootLayout() {
  // Fraunces (display serif) + Hanken Grotesk (utility) power the home screen
  // type. Loaded at runtime via expo-font — no native rebuild required.
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
  });

  if (!fontsLoaded) return null;

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
