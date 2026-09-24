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
  HankenGrotesk_700Bold,
} from '@expo-google-fonts/hanken-grotesk';
import { Appearance } from 'react-native';
import { applyGlobalFont } from 'lib/applyGlobalFont';

// Make Hanken Grotesk the app-wide default font (weight-aware). Runs once at
// module load, before any <Text> renders. Explicit fontFamily still wins.
applyGlobalFont();

// Pin the app dark at runtime. Every surface is ink and the nav theme is DarkTheme,
// so system-drawn chrome -- above all the native tab bar's Liquid Glass -- has to
// resolve dark too, or it renders light over a dark app.
//
// THIS IS NOT REDUNDANT WITH `userInterfaceStyle: 'dark'` IN app.config.js. The two
// cover different gaps, and each is the only thing that works in its own:
//   - iOS: the config is what prebuild writes into Info.plist as UIUserInterfaceStyle,
//     and it is the only thing covering launch until JS boots. This call cannot do
//     that. Here it just re-asserts the same value.
//   - Android: the config is a NO-OP. @expo/prebuild-config's withAndroidUserInterfaceStyle
//     only logs "Install expo-system-ui to enable this feature", and expo-system-ui is
//     not a dependency. The theme is Theme.AppCompat.DayNight, so without this call
//     Android follows the phone's system setting. This is the only thing pinning it.
// Installing expo-system-ui would make the config authoritative on both platforms and
// demote this to belt-and-braces. Until then, do not delete it -- Android regresses.
Appearance.setColorScheme('dark');

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
    HankenGrotesk_700Bold,
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
