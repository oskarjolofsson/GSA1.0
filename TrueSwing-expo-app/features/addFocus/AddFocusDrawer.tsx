import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { List, Video, FileText } from 'lucide-react-native';

const GOLD = '#E4C892';

type Entry = {
  key: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: '/add-focus/browse' | '/add-focus/upload' | '/add-focus/coach';
};

/**
 * The three ways to start a focus, as hairline rows.
 *
 *   START A FOCUS
 *
 *   [List]   Browse the library
 *            Pick what to work on
 *            ────────────────────────
 *   [Video]  Upload a swing
 *            Let AI find your misses
 *            ────────────────────────
 *   [File]   Coach feedback
 *            Turn a lesson into a plan
 *
 * NOT PANELS, AND NOT THE OLD CHOOSER. This replaced `FocusPanel`, whose hero
 * variant was a gold LinearGradient with a glow and a 24px radius. That broke
 * three DESIGN.md rules at once — "No gradients", "Gold is a stroke or a
 * small-caps label, never a fill", "Hairline rules, not cards" — and it mattered
 * more here than on the full screen it came from: at 300px over a dimmed
 * photograph, a gold card is the loudest object in the app.
 *
 * THREE EQUAL PEERS, no primary. The old chooser promoted "Browse the library"
 * to a hero. A golfer arriving with their coach's notes is not taking the lesser
 * path, and the drawer has no idea which of the three they want — that is the
 * whole reason they opened it.
 *
 * GOLD APPEARS EXACTLY THREE TIMES, as three icon strokes, which is DESIGN.md's
 * per-screen cap. That is also why the `+` that opens this drawer is cream and
 * not gold: it would have been a fourth, and both are on screen together.
 *
 * SUBTITLES ARE ONE LINE EACH (<=34 chars). The originals were written for a
 * full-width screen and wrapped to four or five lines at this width, which is
 * the opposite of the ~60% air the brand book runs on.
 *
 * The rows push routes rather than swapping state in place. That is load-bearing,
 * not stylistic: `useRequirePremiumEntry` gates on route focus, and a drawer does
 * not blur the screen behind it, so a flow rendered inside this component would
 * never fire the paywall.
 */
const ENTRIES: Entry[] = [
  {
    key: 'browse',
    icon: <List size={17} color={GOLD} strokeWidth={2} />,
    title: 'Browse the library',
    subtitle: 'Pick what to work on',
    href: '/add-focus/browse',
  },
  {
    key: 'upload',
    icon: <Video size={17} color={GOLD} strokeWidth={2} />,
    title: 'Upload a swing',
    subtitle: 'Let AI find your misses',
    href: '/add-focus/upload',
  },
  // {
  //   key: 'coach',
  //   icon: <FileText size={17} color={GOLD} strokeWidth={2} />,
  //   title: 'Coach feedback',
  //   subtitle: 'Turn a lesson into a plan',
  //   href: '/add-focus/coach',
  // },
];

export default function AddFocusDrawer({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const open = React.useCallback(
    (href: Entry['href']) => {
      // Close first, then push. The drawer is non-interactive during its close
      // animation, which is what stops a double-tap pushing the route twice.
      navigation.closeDrawer();
      router.push(href);
    },
    [navigation, router]
  );

  return (
    <View className="flex-1 bg-ink px-5" style={{ paddingTop: insets.top + 24 }}>
      <Text className="mb-7 font-sans-semibold text-[11px] uppercase tracking-[2.5px] text-sand-dim">
        Start a focus
      </Text>

      {ENTRIES.map((entry, index) => (
        <Pressable
          key={entry.key}
          onPress={() => open(entry.href)}
          accessibilityRole="button"
          accessibilityLabel={`${entry.title}. ${entry.subtitle}`}
          className={
            index === ENTRIES.length - 1
              ? 'min-h-[44px] flex-row items-start gap-x-3 py-4'
              : 'min-h-[44px] flex-row items-start gap-x-3 border-b border-white/[.07] py-4'
          }
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
          <View className="mt-1">{entry.icon}</View>
          <View className="flex-1">
            <Text className="font-display text-[17px] leading-[21px] text-sand">{entry.title}</Text>
            <Text className="mt-1 text-[13px] leading-[18px] text-sand-dim">{entry.subtitle}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
