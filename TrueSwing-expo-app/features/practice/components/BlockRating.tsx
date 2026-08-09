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
 * THIS COMPONENT OWNS THE QUESTION, AND THAT IS THE BUG FIX. The prompt used to be rendered
 * by the parent screen, in a `flex-1` region that sat above this block inside a
 * `justify-between` column. A ten-rep count grid is about 400px, plus the caption, "Log it"
 * and "Skip" -- roughly 560px of bottom content on an 844px screen. The `flex-1` region
 * collapsed toward zero and the question was clipped out of existence: the golfer finished
 * hitting balls and got a number pad with nothing telling them what it was for. Owning the
 * prompt here means no sibling can squeeze it, and the input is what yields instead.
 *
 * The `default` branch is the other load-bearing part. `drills.metric` is authored in the
 * admin CMS with no app release, so any build in the wild can be handed a metric type it has
 * never heard of. An unknown type and a null metric route to the same place: the feel picker,
 * which always completes.
 *
 * The screen never sends a grade for a scored drill. It posts the raw number and the server
 * decides what it was worth, because `grade_at` is editable content and an old build would
 * otherwise judge against thresholds nobody can see any more.
 */
export default function BlockRating({ metric: raw, onComplete, disabled = false }: Props) {
  const metric = asMetric(raw);
  const renderable = isRenderable(metric);
  const counted = isCounted(metric);

  const [count, setCount] = useState<number | null>(null);
  const [proximity, setProximity] = useState<number>(() => proximityStart(metric));

  const value = counted ? count : proximity;
  // A counted drill has nothing to log until a tile is tapped. Proximity always has a
  // value (it opens at half the ceiling), so its action is live from the start.
  const canLog = value !== null;
  const caption = renderable ? gradeCaption(gradePreview(metric, value)) : null;

  return (
    <View className="flex-1">
      {/* Fixed. The whole point of this component's structure. */}
      <View>
        <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
          How it went
        </Text>
        <Text className="mt-3 font-display-bold text-[24px] leading-[30px] text-sand">
          {promptFor(metric)}
        </Text>
      </View>

      {/* Yields. A 20-rep grid scrolls inside this box instead of pushing the
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
        {/* What that number is worth, live, named as a consequence rather than a
                    compliment -- an "OK" block moves a drill's strength by exactly zero, so
                    calling it "Solid" was the screen telling the golfer something the
                    scheduler does not record. Reserved height so selecting a tile does not
                    shift the button under their thumb. */}
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
 * Skipping is always available and always completes the block.
 *
 * A golfer who lost count, got rained on, or simply does not want to record a number still
 * showed up. The session counts; only the grade is lost, which leaves the drill's strength
 * exactly where it was.
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
