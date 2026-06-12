import { Pressable, Text, View } from "react-native";
import { ScreenProps } from "features/shared/types";
import { PracticeSession } from "../types";
import { usePracticeResultsState } from "../hooks/usePracticeResultsState";
import type { DrillRun } from "features/drill/types/DrillRun";
import { useMemo } from "react";
import { ScrollView } from "react-native";
import { ArrowLeft } from "lucide-react-native";

type Props = ScreenProps & {
    session: PracticeSession;
}

type PracticeSummaryScreenProps = {
    drillRuns: DrillRun[];
    onPracticeAnother: () => void;
    onDone?: () => void;
};

type DrillSummary = {
    id: string;
    title: string;
    skipped: boolean;
    successfulReps: number;
    failedReps: number;
    totalReps: number;
    successPercentage: number;
};

function summarizeDrillRuns(drillRuns: DrillRun[]) {
    const totalDrills = drillRuns.length;
    const skippedDrills = drillRuns.filter((run) => run.skipped).length;

    const totalSuccessfulReps = drillRuns.reduce(
        (sum, run) => sum + run.successful_reps,
        0
    );

    const totalFailedReps = drillRuns.reduce(
        (sum, run) => sum + run.failed_reps,
        0
    );

    const totalReps = totalSuccessfulReps + totalFailedReps;

    const successPercentage =
        totalReps > 0 ? Math.round((totalSuccessfulReps / totalReps) * 100) : 0;

    const drillSummaries: DrillSummary[] = drillRuns.map((run) => {
        const totalRepsForDrill = run.successful_reps + run.failed_reps;
        const successPercentageForDrill =
            totalRepsForDrill > 0
                ? Math.round((run.successful_reps / totalRepsForDrill) * 100)
                : 0;

        return {
            id: run.id,
            title: run.drill_title,
            skipped: run.skipped,
            successfulReps: run.successful_reps,
            failedReps: run.failed_reps,
            totalReps: totalRepsForDrill,
            successPercentage: successPercentageForDrill,
        };
    });

    return {
        totalDrills,
        skippedDrills,
        totalSuccessfulReps,
        totalFailedReps,
        totalReps,
        successPercentage,
        drillSummaries,
    };
}


function StatPill({
    label,
    value,
    variant = "neutral",
}: {
    label: string;
    value: number | string;
    variant?: "good" | "bad" | "neutral";
}) {
    const styles = {
        good: "bg-emerald-500/10 border-emerald-400/20",
        bad: "bg-rose-500/10 border-rose-400/20",
        neutral: "bg-white/5 border-white/10",
    };

    const textColors = {
        good: "text-emerald-300",
        bad: "text-rose-300",
        neutral: "text-white",
    };

    return (
        <View
            className={`flex-row items-center justify-between rounded-xl border px-3 py-2 ${styles[variant]}`}
        >
            <Text className={`text-sm font-semibold mr-2 ${textColors[variant]}`}>
                {value}
            </Text>
            <Text className="text-[11px] font-medium text-slate-400">
                {label}
            </Text>
        </View>
    );
}


function DrillRow({ drill }: { drill: DrillSummary }) {
    return (
        <View className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1">
                    <Text className="text-base font-semibold text-white" numberOfLines={2}>
                        {drill.title}
                    </Text>

                    {drill.skipped ? (
                        <Text className="mt-2 text-sm text-amber-300">Skipped</Text>
                    ) : (
                        <Text className="mt-2 text-sm text-slate-300">
                            {drill.successfulReps} good · {drill.failedReps} bad
                        </Text>
                    )}
                </View>

                <View className="items-end">
                    <Text className="text-xl font-bold text-white">
                        {drill.skipped ? "—" : `${drill.successPercentage}%`}
                    </Text>
                    <Text className="mt-1 text-xs text-slate-500">
                        {drill.skipped ? "not done" : "success"}
                    </Text>
                </View>
            </View>
        </View>
    );
}



export default function DrillResultScreen({ session, onNext, onBack }: Props) {
    const results = usePracticeResultsState({ sessionId: session.id });
    const drillRuns: DrillRun[] = results.DrillRuns;
    const summary = useMemo(() => summarizeDrillRuns(drillRuns), [drillRuns]);

    return (
        <View className="flex-1 bg-slate-950">
            <View className="px-5 pt-16 flex-col justify-center flex-1">

                {/* Upper summary section */}
                <View className="rounded-[28px] border border-white/10 bg-white/5 px-5 py-6">
                    <View className="flex-row items-start justify-between">

                        {/* Left */}
                        <View>
                            <Text className="text-[11px] font-medium uppercase tracking-[2px] text-slate-400">
                                Practice complete
                            </Text>

                            <Text className="mt-3 text-7xl font-extrabold text-white">
                                {summary.successPercentage}%
                            </Text>

                            <Text className="mt-1 text-sm text-slate-400">
                                Success rate
                            </Text>
                        </View>

                        {/* Right */}
                        <View className="ml-5 gap-2">
                            <StatPill label="Good" value={summary.totalSuccessfulReps} variant="good" />
                            <StatPill label="Bad" value={summary.totalFailedReps} variant="bad" />
                            <StatPill label="Skipped" value={summary.skippedDrills} variant="neutral" />
                        </View>

                    </View>
                </View>

                {/* Mid Drill Breakdown section */}
                <View className="mt-6 rounded-[28px] border border-white/10 bg-white/5 px-4 py-5">
                    <Text className="px-1 text-lg font-semibold text-white">
                        Drill breakdown
                    </Text>


                    <View className="mt-4 gap-3">
                        {summary.drillSummaries.map((drill) => (
                            <DrillRow key={drill.id} drill={drill} />
                        ))}
                    </View>
                </View>

                {/* Lower Practice Another section */}
                {/* <View className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4">
                    <Text className="text-base font-semibold text-white">
                        Ready for another one?
                    </Text>
                    <Text className="mt-1 text-sm leading-5 text-slate-400">
                        Keep building consistency with another drill.
                    </Text>

                    <Pressable
                        onPress={() => { console.log('Practice another drill') }} // Placeholder for actual navigation logic
                        className="mt-4 items-center rounded-2xl bg-white px-4 py-4 active:opacity-80"
                    >
                        <Text className="text-base font-semibold text-slate-950">
                            Practice another drill
                        </Text>
                    </Pressable>


                    <Pressable
                        onPress={onBack}
                        className="mt-3 items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-4 active:bg-white/10"
                    >
                        <Text className="text-base font-medium text-slate-200">
                            Done for now
                        </Text>
                    </Pressable>

                </View> */}

                <Pressable
                    onPress={onBack}
                    className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 py-4 active:bg-slate-800/70"
                >
                    <ArrowLeft size={16} color="#f87171" />
                    <Text className="text-base font-semibold text-slate-300">
                        Exit Practice
                    </Text>
                </Pressable>

            </View>
        </View>
    )
}