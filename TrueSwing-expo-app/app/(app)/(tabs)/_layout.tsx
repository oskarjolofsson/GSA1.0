import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import colors from 'lib/colors';

/**
 * The app's three places: home, a new swing, you.
 *
 * NATIVE TABS, NOT A JS TAB BAR. This renders a real `UITabBar` on iOS and a real
 * Material 3 navigation bar on Android, which is the only way to get iOS 26's Liquid
 * Glass -- the blur and the specular edge are system-drawn
 * and cannot be reproduced in JS. The cost is that almost nothing here is styleable:
 * tint and icon colors are the whole surface area, so the bar reads as an Apple/Material
 * bar rather than as DESIGN.md's ink-and-gold chrome. That is the trade.
 *
 * DO NOT SET `backgroundColor` ON iOS. A background color replaces the glass with a
 * flat fill and the effect is silently gone. Android has no glass to lose, and the
 * default M3 surface is light, so it needs the explicit ink fill.
 *
 * ICONS ONLY, AND THE ACCESSIBILITY LABELS ARE NOT OPTIONAL. Hiding a label sets the
 * item's title to `''`, which on iOS is also its VoiceOver name -- left alone, the bar
 * announces the SF Symbol ("house") or nothing at all. `tabBarItemAccessibilityLabel`
 * puts the real name back without printing it. Delete those and the bar is unusable
 * with a screen reader while looking perfectly fine.
 */
export default function TabsLayout() {
  return (
    <NativeTabs
      iconColor={{ default: colors['sand-dim'], selected: colors.gold }}
      tintColor={colors.gold}
      {...Platform.select({
        android: {
          backgroundColor: colors.ink,
          rippleColor: 'rgba(228,200,146,0.14)',
          indicatorColor: 'rgba(228,200,146,0.18)',
          // iOS drops the label the moment the title is empty; Android keeps the slot
          // and centers the icon only when told to.
          labelVisibilityMode: 'unlabeled' as const,
        },
        default: {},
      })}>
      <NativeTabs.Trigger
        name="(home)"
        unstable_nativeProps={{ tabBarItemAccessibilityLabel: 'Home' }}>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label hidden />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="new-swing"
        unstable_nativeProps={{ tabBarItemAccessibilityLabel: 'New swing' }}>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }}
          md="add_circle"
        />
        <NativeTabs.Trigger.Label hidden />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="profile"
        unstable_nativeProps={{ tabBarItemAccessibilityLabel: 'Profile' }}>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="account_circle"
        />
        <NativeTabs.Trigger.Label hidden />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
