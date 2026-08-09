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
 * One open program, and the screen's primary action.
 *
 *   Hold your finish                    (i)
 *   Slow takeaway · Mirror check
 *   ▬▬░░░░
 *   ┌──────────────────────────────────────┐
 *   │            Start practice            │   gold, 1px stroke
 *   └──────────────────────────────────────┘
 *
 * NO CARD, NO SURFACE, NO SHADOW. DESIGN.md: "Cards earn their existence. Use one
 * when the card *is* the interaction... Not to group text." This is type on ink.
 *
 * THE BUTTON EXISTS BECAUSE A GOLFER COULD NOT FIND THE OLD ONE. A usability test
 * (2026-08-09, a non-technical golfer) got as far as picking an area and then
 * stalled: starting a session was a 13px underlined link, the smallest text on a
 * screen whose largest was a 48px streak count. She read the hierarchy correctly;
 * the hierarchy was wrong.
 *
 * WHY IT IS A STROKE AND NOT A FILL. `SLOTS_PER_AREA = 2`, so this row can render
 * twice. DESIGN.md allows a gold FILL only for "a genuinely primary, one-per-screen
 * action" — two filled buttons would break that, the same rule that killed the old
 * add-focus hero panel. A stroke is legal twice, and the screen's gold now totals
 * exactly three: the selected area tab plus at most two of these.
 *
 * THAT BUDGET WAS PAID FOR BY DELETING THE ROUND ROW. Before, "Played a round? /
 * Log it" held two of the three gold appearances and this row had none — the
 * loudest thing on the screen pointed at the least important action.
 *
 * TAPPING THE TITLE NO LONGER OPENS THE SHEET. It used to, and the info button is
 * new. Starting a session writes a `practice_sessions` row server-side, so making
 * the whole row a trigger would turn every curious tap into real state (TODOS
 * already tracks orphaned sessions). The row is inert; two explicit targets.
 *
 * NO NUMERAL. The `2/6` that sat top-right is gone — the segment bar underneath
 * already carries the same count, and at 22px the numeral was competing with the
 * focus title for the eye while telling the golfer nothing they need before
 * deciding to practise.
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
      <View className="flex-row items-start gap-x-3">
        <View className="min-w-0 flex-1">
          <Text className="font-display text-[19px] leading-[24px] text-sand">{program.title}</Text>
          <Text className="mt-1 text-[13px] leading-[19px] text-sand-dim" numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        {/* The only other target on the row. Carries what the title used to:
            what the jargon means, swing history, and removing the focus. */}
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
