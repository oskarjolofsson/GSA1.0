import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';

const GOLD = '#E4C892';

type Props = {
  onStart: () => void;
};

/**
 * The golfer has no focus anywhere -- nothing open, nothing diagnosed.
 *
 * Sits UNDER the hero and area tabs rather than replacing the screen, so a first-run golfer
 * sees the same home they will keep seeing, with the areas already in front of them.
 *
 * Mirrors AreaEmptyCard's "+" invitation rather than a text-only block, with an extra line
 * explaining what choosing a focus does, since this is the very first thing a new golfer sees.
 */
export default function HomeEmptyBody({ onStart }: Props) {
  return (
    <View className="items-center" style={{ minHeight: 280 }}>
      <Text className="font-display text-[26px] leading-[31px] text-sand">
        Turn consistency into lower scores.
      </Text>

      <Text className="mt-3 max-w-[260px] text-center text-[13px] leading-[20px] text-sand-dim">
        Your streak starts with one focus. Film a swing, turn coach feedback into a plan, or browse
        the library — then build the daily habit.
      </Text>

      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel="Choose your focus"
        className="mt-6 items-center active:opacity-70">
        <View className="h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-gold">
          <Plus size={22} color={GOLD} strokeWidth={2} />
        </View>
        <Text className="mt-2.5 font-sans-semibold text-[13px] text-gold">Choose your focus</Text>
      </Pressable>
    </View>
  );
}
