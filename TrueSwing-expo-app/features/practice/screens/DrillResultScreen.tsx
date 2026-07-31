import { Pressable, Text, View } from "react-native";
import { ScreenProps } from "features/shared/types";
import { PracticeSession } from "../types";
import { usePracticeResultsState } from "../hooks/usePracticeResultsState";
import type { DrillRun } from "features/drill/types/DrillRun";
import { useMemo } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";

type Props = ScreenProps & {
    session: PracticeSession;
}

export default function DrillResultScreen({ session, onBack }: Props) {
    const results = usePracticeResultsState({ sessionId: session.id });
    const drillRuns: DrillRun[] = results.DrillRuns;
    const completedDrills = useMemo(
        () => drillRuns.filter((run) => !run.skipped).length,
        [drillRuns]
    );

    return (
        <View className="flex-1 bg-slate-950">
            <View className="px-5 pt-16 flex-col justify-center flex-1">

                {/* Completion hero */}
                <View className="items-center rounded-[28px] border border-white/10 bg-white/5 px-5 py-8">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                        <CheckCircle2 size={34} color="#34d399" />
                    </View>

                    <Text className="mt-5 text-3xl font-display-black text-white">
                        Session complete
                    </Text>

                    <Text className="mt-2 text-center text-base text-slate-400">
                        You showed up and worked {completedDrills} drill{completedDrills === 1 ? "" : "s"}.
                        That’s another square earned.
                    </Text>
                </View>

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
