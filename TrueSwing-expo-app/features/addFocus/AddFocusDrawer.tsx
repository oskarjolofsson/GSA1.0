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
 * The ways to start a focus, as hairline rows -- equal peers, no primary. The drawer has no
 * idea which one the golfer wants; that is why they opened it.
 *
 * Rows push routes rather than swapping state in place, and that is load-bearing:
 * `useRequirePremiumEntry` gates on route focus, and a drawer does not blur the screen
 * behind it, so a flow rendered inside this component would never fire the paywall.
 *
 * Icon strokes are the only gold on this surface, which is why the `+` that opens the drawer
 * is cream -- both are on screen together and DESIGN.md caps gold per screen. Subtitles must
 * stay one line (<=34 chars) at drawer width.
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
