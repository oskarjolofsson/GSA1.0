import React from 'react';
import { View, Text, Pressable } from 'react-native';

type Props = {
  onPress: () => void;
};

/**
 * "Played a round?" — always available, never tied to a program.
 *
 *   ○  Played a round?                Log it
 *
 * A round used to be a step inside a program, which meant a golfer carrying three
 * focuses got three separate "go play 9 holes" prompts for the same round. Playing
 * serves every open focus at once, so it left the program engine entirely: a round
 * is a practice_sessions row with session_type = 'play', and nothing schedules it.
 *
 * That also means this row is the ONLY way to log one. Before it existed the
 * capability was unreachable — the old entry point was gated on a play step that
 * no longer gets created, so a golfer could play nine holes and have nowhere to
 * say so.
 *
 * The gold-stroked circle is a reserved icon slot, same idea as AreaGrid's: art is
 * coming, and reserving it now makes that a drop-in rather than a re-layout.
 */
export default function LogRoundRow({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Log a round you played"
      className="min-h-[44px] flex-row items-center justify-between">
      <View className="flex-row items-center gap-x-3">
        <View className="h-[26px] w-[26px] rounded-full border border-gold/55" />
        <Text className="text-[13.5px] leading-[19px] text-sand">Played a round?</Text>
      </View>
      <Text className="font-sans-semibold text-[13px] text-gold">Log it</Text>
    </Pressable>
  );
}
