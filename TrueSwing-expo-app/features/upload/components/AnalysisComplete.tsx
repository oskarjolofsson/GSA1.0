import { Pressable, Text, View } from 'react-native';
import { MotiView } from 'moti';
import Svg, { Circle, Path } from 'react-native-svg';

type AnalysisCompleteProps = {
  onNext: () => void;
  onBack: () => void;
};

/**
 * The done state. Was GreenCheck.tsx, and was green throughout — DESIGN.md is
 * explicit that there is no green in this brand, so the mark is a gold stroke on
 * ink instead. The copy lost its exclamation mark for the same reason: the voice
 * is "Honest", and finishing an upload is not an achievement worth congratulating.
 */
export default function AnalysisComplete({ onNext, onBack }: AnalysisCompleteProps) {
  return (
    <View className="flex-1 items-center justify-center bg-ink px-6">
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 420 }}
        className="items-center">
        {/* Gold stroke, no fill — gold is a stroke in this system, never a disc. */}
        <MotiView
          from={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 80 }}>
          <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
            <Circle cx="36" cy="36" r="34" stroke="#E4C892" strokeWidth="1.5" />
            <Path
              d="M21 37.5L31 47.5L51 27.5"
              stroke="#E4C892"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 240, type: 'timing', duration: 400 }}>
          <Text className="mt-8 text-center font-display text-[28px] leading-[34px] text-sand">
            Analysis complete
          </Text>
          <Text className="mt-2 text-center text-[13px] leading-[19px] text-sand-dim">
            Your results are ready.
          </Text>
        </MotiView>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 400, type: 'timing', duration: 400 }}
        className="mt-14 w-full items-center">
        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          className="min-h-[44px] w-full max-w-xs items-center justify-center rounded-full border border-gold px-6 py-4 active:opacity-70">
          <Text className="font-sans-medium text-[15px] text-gold">View results</Text>
        </Pressable>

        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          className="mt-6 min-h-[44px] items-center justify-center active:opacity-70">
          <Text className="text-[13px] text-sand-dim">Film another swing</Text>
        </Pressable>
      </MotiView>
    </View>
  );
}
