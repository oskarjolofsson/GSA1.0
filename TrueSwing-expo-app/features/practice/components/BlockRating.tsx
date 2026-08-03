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
 * The `default` branch is the load-bearing part. `drills.metric` is authored in the admin
 * CMS with no app release, so any build in the wild can be handed a metric type it has
 * never heard of. Before this existed the rating phase had three hardcoded states and no
 * fallback, which meant the golfer finished hitting balls and got a blank screen with no
 * way to complete the session -- no square on the graph, which is the app's core promise.
 *
 * So an unknown type and a null metric route to the same place: the feel picker.
 *
 * The screen never sends a grade. It posts the raw number and the server decides what it
 * was worth, because `grade_at` is editable content and an old build would otherwise judge
 * against thresholds nobody can see any more.
 */
export default function BlockRating({ metric: raw, onComplete, disabled = false }: Props) {
    const metric = asMetric(raw);
    const renderable = isRenderable(metric);
    const counted = isCounted(metric);

    const [count, setCount] = useState<number | null>(null);
    const [proximity, setProximity] = useState<number>(() => proximityStart(metric));

    // Feel-only, or a metric authored after this build shipped.
    if (!renderable) {
        return (
            <View>
                <FeelPicker
                    disabled={disabled}
                    onPick={(feel) => onComplete({ feel, metricValue: null })}
                />
                <SkipButton
                    disabled={disabled}
                    onPress={() => onComplete({ feel: null, metricValue: null })}
                />
            </View>
        );
    }

    const value = counted ? count : proximity;
    // A counted drill has nothing to log until a tile is tapped. Proximity always has a
    // value (it opens at half the ceiling), so its action is live from the start.
    const canLog = value !== null;
    const caption = gradeCaption(gradePreview(metric, value));

    return (
        <View>
            {counted ? (
                <CountGrid
                    reps={repsOf(metric)}
                    value={count}
                    disabled={disabled}
                    onSelect={setCount}
                />
            ) : (
                <ProximityStepper
                    value={proximity}
                    unit={unitOf(metric)}
                    disabled={disabled}
                    onChange={setProximity}
                />
            )}

            {/* What that number is worth, live. Without it the golfer enters a score and
                learns nothing until the results screen, leaving the link between "8 out
                of 10" and the drill scheduled next as invisible machinery. Reserved
                height so selecting a tile does not shift the button under their thumb. */}
            <View className="h-6 items-center justify-center">
                {caption ? (
                    <Text className="text-sm font-sans-medium text-gold">{caption}</Text>
                ) : null}
            </View>

            <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: disabled || !canLog }}
                disabled={disabled || !canLog}
                onPress={() => onComplete({ feel: null, metricValue: value })}
                className={`mt-2 h-20 items-center justify-center rounded-3xl ${
                    disabled || !canLog ? 'bg-gold/30' : 'bg-gold active:bg-gold-deep'
                }`}
            >
                <Text className="text-xl font-sans-bold text-ink">Log it</Text>
            </Pressable>

            <SkipButton
                disabled={disabled}
                onPress={() => onComplete({ feel: null, metricValue: null })}
            />
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
            disabled={disabled}
            onPress={onPress}
            className="mt-3 items-center justify-center py-3 active:opacity-70"
        >
            <Text className="text-base font-sans-medium text-sand-dim">Skip</Text>
        </Pressable>
    );
}

export { promptFor };
