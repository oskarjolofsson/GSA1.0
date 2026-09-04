import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { BlockFeel } from '../utils/blockFeel';
import {
  asMetric,
  gradeCaption,
  gradePreview,
  isCounted,
  isRenderable,
  promptFor,
  proximityStart,
  repsOf,
  unitOf,
} from '../utils/drillMetric';
import CountGrid from './CountGrid';
import FeelPicker from './FeelPicker';
import ProximityStepper from './ProximityStepper';

export type BlockResult = { feel: BlockFeel | null; metricValue: number | null };

type Props = {
  /** The drill's `metric` column, untyped from the backend. Null = feel-only. */
  metric: unknown;
  onComplete: (result: BlockResult) => void;
  disabled?: boolean;
};

/**
 * The rating phase: how a finished block gets recorded.
 *
 * This component owns the prompt as well as the input, so no sibling can squeeze it -- with
 * the prompt in a `flex-1` sibling above, a ten-rep grid collapsed it to nothing and the
 * golfer got a number pad with no question. The input yields instead.
 *
 * An unknown metric type and a null metric both route to the feel picker, which always
 * completes. A scored drill posts its raw number and never a grade. See ADR-0020.
 */
export default function BlockRating({ metric: raw, onComplete, disabled = false }: Props) {
  const metric = asMetric(raw);
  const renderable = isRenderable(metric);
  const counted = isCounted(metric);

  const [count, setCount] = useState<number | null>(null);
  const [proximity, setProximity] = useState<number>(() => proximityStart(metric));

  const value = counted ? count : proximity;
  // A counted drill has nothing to log until a tile is tapped; proximity opens at half the
  // ceiling, so its action is live from the start.
  const canLog = value !== null;
  const caption = renderable ? gradeCaption(gradePreview(metric, value)) : null;

  return (
    <View className="flex-1">
      {/* Fixed height: this is what must not be squeezed. */}
      <View>
        <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
          How it went
        </Text>
        <Text className="mt-3 font-display-bold text-[24px] leading-[30px] text-sand">
          {promptFor(metric)}
        </Text>
      </View>

      {/* Yields. A 20-rep grid shrinks inside this box rather than pushing the
                question off the top or the button off the bottom. */}
      <View className="my-6 flex-1 justify-center">
        {!renderable ? (
          <FeelPicker
            disabled={disabled}
            onPick={(feel) => onComplete({ feel, metricValue: null })}
          />
        ) : counted ? (
          <CountGrid reps={repsOf(metric)} value={count} disabled={disabled} onSelect={setCount} />
        ) : (
          <ProximityStepper
            value={proximity}
            unit={unitOf(metric)}
            disabled={disabled}
            onChange={setProximity}
          />
        )}
      </View>

      <View>
        {/* Live grade preview (ADR-0020). Height is reserved so selecting a tile
                    does not shift the button under the golfer's thumb. */}
        {renderable ? (
          <View className="h-6 items-center justify-center">
            {caption ? (
              <Text className="font-sans-medium text-[13px] text-gold">{caption}</Text>
            ) : null}
          </View>
        ) : null}

        {renderable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: disabled || !canLog }}
            disabled={disabled || !canLog}
            onPress={() => onComplete({ feel: null, metricValue: value })}
            className={`mt-2 h-20 items-center justify-center rounded-3xl ${
              disabled || !canLog ? 'bg-gold/30' : 'bg-gold active:bg-gold-deep'
            }`}>
            <Text className="font-sans-bold text-xl text-ink">Log it</Text>
          </Pressable>
        ) : null}

        <SkipButton
          disabled={disabled}
          onPress={() => onComplete({ feel: null, metricValue: null })}
        />
      </View>
    </View>
  );
}

/**
 * Skipping is always available and always completes the block. The session counts; only the
 * grade is lost, leaving the drill's strength where it was.
 */
function SkipButton({ disabled, onPress }: { disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className="mt-3 items-center justify-center py-3 active:opacity-70"
      style={{ minHeight: 44 }}>
      <Text className="font-sans-medium text-base text-sand-dim">Skip</Text>
    </Pressable>
  );
}

export { promptFor };
