import { Text, View } from 'react-native';

import type { DrillRun } from 'features/drill/types/DrillRun';
import { formatProximity } from '../utils/drillMetric';
import { ordinalToFeel, FEEL_LABEL } from '../utils/blockFeel';

/**
 * What the golfer actually scored this session, drill by drill.
 *
 * Only rendered when at least one block was scored. A pure feel session says nothing here
 * — "Rough, OK, Dialed" listed back is not information, and the completion message above
 * already carries the point: you showed up.
 *
 * The grade comes from the server, not from this build. It re-derives on every read, so a
 * drill retuned in the admin changes how past sessions read.
 */
export default function SessionScoreList({ runs }: { runs: DrillRun[] }) {
    const scored = runs.filter((run) => !run.skipped && run.metric_value !== null);
    if (scored.length === 0) return null;

    return (
        <View className="mt-6 overflow-hidden rounded-[28px] border border-white/10">
            {scored.map((run, index) => (
                <View
                    key={run.id}
                    className={`flex-row items-center justify-between px-5 py-4 ${
                        index > 0 ? 'border-t border-white/10' : ''
                    }`}
                >
                    <View className="flex-1 pr-4">
                        <Text numberOfLines={1} className="text-base font-sans-medium text-sand">
                            {run.drill_title}
                        </Text>
                        {run.feel ? (
                            <Text className="text-sm text-sand-dim">
                                Felt {FEEL_LABEL[ordinalToFeel(run.feel)!]?.toLowerCase()}
                            </Text>
                        ) : null}
                    </View>

                    <View className="items-end">
                        <Text className="text-2xl font-display-bold text-sand">
                            {formatScore(run)}
                        </Text>
                        {run.grade ? (
                            <Text className="text-xs uppercase tracking-[1.5px] text-gold">
                                {run.grade}
                            </Text>
                        ) : null}
                    </View>
                </View>
            ))}
        </View>
    );
}

/**
 * Proximity reads as a decimal ("4.2"); counts read as whole numbers ("8").
 *
 * `metric_type` is stamped on the run at completion rather than read from the drill, so a
 * drill later retuned from make_rate to proximity cannot turn a historical "8 made" into
 * "8.0 feet away".
 */
function formatScore(run: DrillRun): string {
    const value = run.metric_value ?? 0;
    return run.metric_type === 'proximity' ? formatProximity(value) : String(value);
}
