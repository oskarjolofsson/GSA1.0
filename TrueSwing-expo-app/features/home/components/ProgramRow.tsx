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

/**
 * One open program, as a scorecard row.
 *
 *   Hold your finish                    2/6
 *   Slow takeaway · Mirror check
 *   ▬▬░░░░
 *   Start session
 *
 * NO CARD, NO SURFACE, NO SHADOW. DESIGN.md: "Cards earn their existence. Use one
 * when the card *is* the interaction... Not to group text." This is type on ink.
 *
 * PROGRESS IS A FRACTION, NOT PROSE. "2 of 6 grooved" has to be parsed as a
 * sentence; `2/6` in the serif is read in one glance. The right-hand numeral
 * column is also structural — programs are the only rows on the screen that have
 * one, so their similarity groups them and separates them from the suggestion
 * list below without needing a box around either.
 *
 * The six-segment hairline carries the same number without a progress bar, and
 * gives the block a base to sit on now that no rule separates one program from
 * the next (that is 34px of air, deliberately — see HomeScreen).
 *
 * NO GOLD. The screen's three gold appearances are spent on the selected tab
 * underline, the round-row icon and "Log it". Two gold Start buttons would break
 * the one-fill-per-screen rule, and colouring one program above the other would
 * invent a hierarchy the data does not support: slot 0 vs slot 1 is allocation
 * order, not importance.
 */
export default function ProgramRow({ program, starting, onStart, onOpenInfo }: Props) {
  const total = program.total_drills;
  const grooved = program.grooved_count;

  // The drills in the next session, when the server resolved them. Falls back
  // to the program title, which is always present.
  const drillNames = program.next_step?.drills?.map((d) => d.title) ?? [];
  const subtitle = drillNames.length > 0 ? drillNames.join(' · ') : program.title;

  // One segment per drill. Guarded: a program can legitimately have zero
  // drills if its issue has none linked yet, and `Array.from({length: 0})` is
  // an empty row rather than a crash.
  const segments = Array.from({ length: Math.max(total, 0) });

  return (
    <View>
      <View className="flex-row items-baseline gap-x-4">
        {/* The title opens the issue sheet. That sheet is where "what does
                    this jargon mean", swing history and removing the focus live —
                    all three used to hang off the old home card. */}
        <Pressable
          onPress={onOpenInfo}
          accessibilityRole="button"
          accessibilityLabel={`About ${program.title}`}
          className="min-w-0 flex-1">
          <Text className="font-display text-[19px] leading-[24px] text-sand">{program.title}</Text>
          <Text className="mt-1 text-[13px] leading-[19px] text-sand-dim" numberOfLines={2}>
            {subtitle}
          </Text>
        </Pressable>

        <Text className="font-display text-[22px] leading-[24px] text-sand">
          {grooved}
          <Text className="font-display text-[15px] text-sand-dim">{`/${total}`}</Text>
        </Text>
      </View>

      {segments.length > 0 ? (
        <View className="mt-3.5 flex-row gap-x-1">
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
        accessibilityLabel={`Start session for ${program.title}`}
        className="mt-4 self-start border-b border-sand/[.35] pb-1"
        style={{ minHeight: 24 }}>
        <Text
          className={`font-sans-semibold text-[13px] ${starting ? 'text-sand-dim' : 'text-sand'}`}>
          {starting ? 'Starting…' : 'Start session'}
        </Text>
      </Pressable>
    </View>
  );
}
