import { View, Text } from 'react-native';
import { MotiView } from 'moti';

export type RailStep = {
  key: string;
  title: string;
  /** Optional second line. Carries the only real number this screen has. */
  detail?: string | null;
};

type Props = {
  steps: RailStep[];
  /** Index of the step in flight. Everything before it is done, after it pending. */
  activeIndex: number;
};

/**
 * The ordered-sequence rail from DESIGN.md: a hairline spine with a gold node per
 * step, filled once that step is behind us.
 *
 *   ●  Uploaded          done      solid gold
 *   │    6.1 MB sent
 *   ◉  Analysing         active    gold stroke + pulsing centre
 *   │    Reading your swing frame by frame
 *   ○  Building program  pending   faint cream stroke
 *
 * The rail exists here rather than a percentage because only the upload phase has
 * a denominator. A ring would have to invent a number the moment the bytes finish,
 * and the brand book's "Honest" is the reason we don't. The pulsing centre node is
 * the one moving element, so the screen reads as working rather than frozen.
 */
export default function ProgressRail({ steps, activeIndex }: Props) {
  return (
    <View>
      {steps.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        const last = index === steps.length - 1;

        return (
          <View key={step.key} className="flex-row">
            {/* Spine column: node, then the hairline running to the next node. */}
            <View className="w-6 items-center">
              <Node done={done} active={active} />
              {!last ? <View className="w-px flex-1 bg-sand/[.13]" /> : null}
            </View>

            <View className={`flex-1 pl-4 ${last ? '' : 'pb-9'}`}>
              <Text
                className={`font-display text-[18px] leading-[22px] ${
                  done || active ? 'text-sand' : 'text-sand-dim'
                }`}>
                {step.title}
              </Text>
              {step.detail ? (
                <Text className="mt-1.5 text-[13px] leading-[18px] text-sand-dim">
                  {step.detail}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Node({ done, active }: { done: boolean; active: boolean }) {
  if (done) {
    return <View className="h-3.5 w-3.5 rounded-full bg-gold" />;
  }

  if (active) {
    return (
      <View className="h-3.5 w-3.5 items-center justify-center rounded-full border border-gold">
        <MotiView
          from={{ opacity: 0.35, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
          className="h-1.5 w-1.5 rounded-full bg-gold"
        />
      </View>
    );
  }

  return <View className="h-3.5 w-3.5 rounded-full border border-sand/20" />;
}
