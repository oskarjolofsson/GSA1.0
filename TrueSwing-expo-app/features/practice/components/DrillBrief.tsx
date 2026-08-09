import { Play } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { Drill } from 'features/drill/types/Drill';
import { parseInstructionSteps } from 'features/shared/utils/parseInstructionSteps';

import { asMetric, repsOf, willLogSentence } from '../utils/drillMetric';

/**
 * The screen a golfer reads once, before the phone goes in their pocket.
 *
 * FIELD TESTING SET THIS LAYOUT. A golfer at a range does not look at their phone between
 * shots, so there is no second chance to communicate anything. Everything they need to hold
 * in their head has to be here: what counts as good, and what they will be asked to record.
 * The block screen that follows deliberately carries less, not more.
 *
 * THE FOCUS POINTS ARE A SET, NOT A SEQUENCE. "Each ball carries close to its target",
 * "swing length scales with the distance" and "the distances ladder cleanly" are all true at
 * the same time, in no order. So they get a gold-stroked mark each -- DESIGN.md's rail node
 * without the spine -- and explicitly no numbers: numbering them would tell the golfer to
 * work through them in turn, which is a lie about the content. A drill's `task` IS ordered
 * and keeps the rail, in the how-to overlay.
 *
 *   ┌─ fixed ──────────────┐   The button is pinned because the criteria are authored in an
 *   │ eyebrow, title,      │   admin CMS with no length limit. On a 375x667 phone three
 *   │ How to               │   two-line criteria already fill the screen, so a fourth or a
 *   ├─ scrolls ────────────┤   long wrap used to push "Start drill" off the bottom -- the
 *   │ YOUR FOCUS + marks   │   same failure as the rating phase, one screen over.
 *   ├─ fixed ──────────────┤
 *   │ will-log, Start      │
 *   └──────────────────────┘
 */

/** Beyond four, a brief stops being something you can hold in your head. */
const MAX_CRITERIA = 4;

type Props = {
  drill: Drill | null;
  ready: boolean;
  onStart: () => void;
  onOpenInstructions: () => void;
};

export default function DrillBrief({ drill, ready, onStart, onOpenInstructions }: Props) {
  const metric = asMetric(drill?.metric);
  const criteria = parseInstructionSteps(drill?.success_signal).slice(0, MAX_CRITERIA);
  const willLog = willLogSentence(metric);

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="flex-grow justify-center py-6"
        showsVerticalScrollIndicator={false}>
        {criteria.length > 0 ? (
          <>
            <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-gold">
              Your focus
            </Text>

            <View
              className="mt-5 gap-5"
              accessibilityRole="list"
              accessibilityLabel={`Your focus: ${criteria.length} things to watch`}>
              {criteria.map((criterion, index) => (
                <View key={`${drill?.id ?? 'c'}-${index}`} className="flex-row gap-3.5">
                  {/* Decorative: the sentence is the content, so VoiceOver
                                        should read it and not "square, square, square". */}
                  <View
                    className="h-[26px] justify-center"
                    accessibilityElementsHidden
                    importantForAccessibility="no">
                    <View className="h-[9px] w-[9px] rounded-[2px] border-[1.5px] border-gold" />
                  </View>
                  <Text className="flex-1 font-display text-[18px] leading-[26px] text-sand">
                    {criterion}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          /* No success_signal authored. DESIGN.md: an empty state names the thing,
                       says one honest sentence about why, and gives one way out. It does NOT
                       dump the drill's task text into the hero, which is what shipped before
                       and turned a set of instructions into a set of focus points. */
          <>
            <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
              No focus points yet
            </Text>
            <Text className="mt-4 font-display text-[18px] leading-[26px] text-sand">
              This drill doesn&apos;t have its focus points written up.
            </Text>
            <Pressable
              onPress={onOpenInstructions}
              accessibilityRole="button"
              className="mt-4 self-start border-b border-sand/[.35] pb-1"
              style={{ minHeight: 24 }}>
              <Text className="font-sans-semibold text-[13px] text-sand">
                Open How to for the steps
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <View>
        <Text className="text-[13px] leading-[19px] text-sand-dim">
          {willLog
            ? `Hit about ${repsOf(metric)} balls with total focus. ${willLog}`
            : `Hit about ${repsOf(metric)} balls with total focus.`}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !ready }}
          disabled={!ready}
          onPress={onStart}
          className={`mt-5 h-20 flex-row items-center justify-center gap-3 rounded-3xl ${
            ready ? 'bg-gold active:bg-gold-deep' : 'bg-gold/30'
          }`}>
          <Play size={26} color="#0A0F1A" fill="#0A0F1A" />
          <Text className="font-sans-bold text-xl text-ink">Start drill</Text>
        </Pressable>
      </View>
    </View>
  );
}
