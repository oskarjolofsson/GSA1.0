import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

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
 * The ordered-sequence rail from DESIGN.md ("Progress and waiting"): a hairline spine
 * with a gold node per step, filled once that step is behind us.
 *
 * A rail rather than a percentage because only the upload phase has a denominator — a
 * ring would have to invent a number once the bytes finish.
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
                testID={active ? 'progress-rail-active-title' : undefined}
                className={`text-[18px] leading-[22px] ${
                  active ? 'font-display-bold text-sand' : done ? 'font-display text-sand' : 'font-display text-sand-dim'
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
    return <View testID="progress-rail-node-done" className="h-3.5 w-3.5 rounded-full bg-gold" />;
  }

  if (active) {
    // A real rotating ring, not `ActivityIndicator`: that native spinner is
    // driven by the OS's own Animator and silently sits still wherever
    // animations are turned off system-side (an emulator's "Window/Transition/
    // Animator duration scale" dev setting, e.g.) -- this one runs on
    // reanimated/moti like the rest of the app's motion, so it always spins.
    return (
      <MotiView
        testID="progress-rail-active-spinner"
        from={{ rotate: '0deg' }}
        animate={{ rotate: '360deg' }}
        transition={{ type: 'timing', duration: 800, easing: Easing.linear, loop: true }}
        style={{
          height: 14,
          width: 14,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: 'rgba(228,200,146,0.25)',
          borderTopColor: '#E4C892',
        }}
      />
    );
  }

  return <View testID="progress-rail-node-pending" className="h-3.5 w-3.5 rounded-full border border-sand/20" />;
}
