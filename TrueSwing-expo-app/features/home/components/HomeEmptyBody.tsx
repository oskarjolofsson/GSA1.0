import React from 'react';
import { View, Text, Pressable } from 'react-native';

type Props = {
  onStart: () => void;
};

/**
 * The golfer has no focus anywhere — nothing open, nothing diagnosed.
 *
 * Sits UNDER the hero and the area tabs rather than replacing the whole screen,
 * which is what the old full-screen HomeWelcome did. Keeping the composition
 * means a first-run golfer sees the same home they will keep seeing, with the
 * areas already in front of them, instead of a separate welcome screen that
 * vanishes forever after one tap.
 *
 * Copy is carried over from HomeWelcome verbatim. What did NOT come across is its
 * gold LinearGradient button: DESIGN.md has no gradients, and "a gold-filled
 * primary button is a SaaS move and reads as someone else's product". The action
 * is a cream underline like every other action on this screen.
 */
export default function HomeEmptyBody({ onStart }: Props) {
  return (
    <View>
      <Text className="font-display text-[26px] leading-[31px] text-sand">
        Turn consistency into lower scores.
      </Text>

      <Text className="mt-3 text-[13px] leading-[20px] text-sand-dim">
        Your streak starts with one focus. Film a swing, turn coach feedback into a plan, or browse
        the library — then build the daily habit.
      </Text>

      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel="Choose your focus"
        className="mt-6 self-start border-b border-sand/[.35] pb-1"
        style={{ minHeight: 24 }}>
        <Text className="font-sans-semibold text-[13px] text-sand">Choose your focus</Text>
      </Pressable>
    </View>
  );
}
