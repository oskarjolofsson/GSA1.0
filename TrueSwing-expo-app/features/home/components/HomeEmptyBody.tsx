import React from 'react';
import { View, Text, Pressable } from 'react-native';

type Props = {
  onStart: () => void;
};

/**
 * The golfer has no focus anywhere -- nothing open, nothing diagnosed.
 *
 * Sits UNDER the hero and area tabs rather than replacing the screen, so a first-run golfer
 * sees the same home they will keep seeing, with the areas already in front of them.
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
