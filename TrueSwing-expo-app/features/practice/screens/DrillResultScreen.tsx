import { Pressable, ScrollView, Text, View } from "react-native";
import { ScreenProps } from "features/shared/types";
import { PracticeSession } from "../types";
import { usePracticeResultsState } from "../hooks/usePracticeResultsState";
import type { DrillRun } from "features/drill/types/DrillRun";
import { useMemo } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react-native";
import SessionScoreList from "../components/SessionScoreList";

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
        <View className="flex-1 bg-ink">
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-5 pt-16 pb-10 flex-grow justify-center"
                showsVerticalScrollIndicator={false}
            >

                {/* Completion hero. Showing up is the headline; the numbers are detail
                    underneath it. A rough session still earns the square, and leading
                    with the score would quietly make that untrue. */}
                <View className="items-center rounded-[28px] border border-white/10 bg-white/5 px-5 py-8">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-gold/15">
                        <CheckCircle2 size={34} color="#E4C892" />
                    </View>

                    <Text className="mt-5 text-3xl font-display-black text-sand">
                        Session complete
                    </Text>

                    <Text className="mt-2 text-center text-base text-sand-dim">
                        You showed up and worked {completedDrills} drill{completedDrills === 1 ? "" : "s"}.
                        That’s another square earned.
                    </Text>
                </View>

                {/* Renders nothing for a pure feel session. */}
                <SessionScoreList runs={drillRuns} />

                <Pressable
                    onPress={onBack}
                    className="mt-6 flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-ink-raised py-4 active:bg-white/10"
                >
                    <ArrowLeft size={16} color="#8A8676" />
                    <Text className="text-base font-sans-semibold text-sand">
                        Exit Practice
                    </Text>
                </Pressable>

            </ScrollView>
        </View>
    )
}
