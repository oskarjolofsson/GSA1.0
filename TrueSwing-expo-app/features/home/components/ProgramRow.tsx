import React from 'react';
import { View, Text, Pressable } from 'react-native';

import type { ProgramSummary } from 'features/programs/types';

type Props = {
  program: ProgramSummary;
  starting: boolean;
  onStart: () => void;
  /** Opens the issue sheet: what the jargon means, swing history, remove. */
  onOpenInfo: () => void;
};

const SAND_DIM = '#8A8676';

/**
 * One open program: title, the drills in the next session, a progress bar, and the screen's
 * primary action. Type on ink -- no card, no surface, no shadow.
 *
 * The row itself is inert; the title and the info button are two explicit targets. Starting
 * a session writes a `practice_sessions` row server-side, so a whole-row trigger would turn
 * every curious tap into real state.
 *
 * The Start button is a gold stroke rather than a fill. See ADR-0021.
 */
export default function ProgramRow({ program, starting, onStart, onOpenInfo }: Props) {
  const total = program.total_drills;
  const grooved = program.grooved_count;

  // Falls back to the program title, which is always present.
  const drillNames = program.next_step?.drills?.map((d) => d.title) ?? [];
  const subtitle = drillNames.length > 0 ? drillNames.join(' · ') : program.title;

  // One segment per drill. A program can legitimately have zero drills, if its issue has
  // none linked yet.
  const segments = Array.from({ length: Math.max(total, 0) });

  return (
    <View>
      <View className="flex-row items-start gap-x-3">
        <View className="min-w-0 flex-1">
          <Text className="font-display text-[19px] leading-[24px] text-sand">{program.title}</Text>
          <Text className="mt-1 text-[13px] leading-[19px] text-sand-dim" numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        {/* Opens the issue sheet: jargon, swing history, remove. */}
        <Pressable
          onPress={onOpenInfo}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`About ${program.title}`}
          className="h-[26px] w-[26px] items-center justify-center rounded-full border border-sand/30 active:opacity-60">
          <Text className="font-display text-[12px] leading-none" style={{ color: SAND_DIM }}>
            i
          </Text>
        </Pressable>
      </View>

      {segments.length > 0 ? (
        <View
          className="mt-3.5 flex-row gap-x-1"
          accessibilityRole="progressbar"
          accessibilityLabel={`${grooved} of ${total} drills filled in`}>
          {segments.map((_, i) => (
            <View
              key={i}
              className={`h-0.5 flex-1 ${i < grooved ? 'bg-sand-dim' : 'bg-sand/10'}`}
            />
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={onStart}
        disabled={starting}
        accessibilityRole="button"
        accessibilityState={{ disabled: starting }}
        accessibilityLabel={`Start practice for ${program.title}`}
        className="mt-4 min-h-[44px] items-center justify-center rounded-[8px] border active:opacity-70"
        style={{ borderColor: starting ? SAND_DIM : '#E4C892' }}>
        <Text
          className={`font-sans-semibold text-[13px] ${starting ? 'text-sand-dim' : 'text-gold'}`}>
          {starting ? 'Starting…' : 'Start practice'}
        </Text>
      </Pressable>
    </View>
  );
}
