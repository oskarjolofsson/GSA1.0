import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { GOALS, type GoalKey } from "../constants/Goals";

type Props = {
    /** Count of startable focuses under each goal, for the subtitle + empty state. */
    countByGoal: Record<string, number>;
    onSelect: (goal: GoalKey) => void;
};

/** The library landing: pick what you want to fix, in plain language. */
export default function GoalGrid({ countByGoal, onSelect }: Props) {
    return (
        <View>
            {GOALS.map((goal) => {
                const count = countByGoal[goal.key] ?? 0;
                const empty = count === 0;
                return (
                    <Pressable
                        key={goal.key}
                        onPress={() => (empty ? undefined : onSelect(goal.key))}
                        disabled={empty}
                        className={`mb-3 flex-row items-center rounded-3xl border px-5 py-4 ${
                            empty ? "border-white/5 bg-white/5" : "border-white/10 bg-white/5 active:opacity-80"
                        }`}
                    >
                        <View className="flex-1">
                            <Text className={`text-lg font-bold ${empty ? "text-slate-500" : "text-white"}`}>
                                {goal.label}
                            </Text>
                            <Text className="mt-0.5 text-sm text-slate-400">
                                {empty ? "Coming soon" : goal.blurb}
                            </Text>
                        </View>
                        {empty ? null : <ChevronRight size={20} color="#94a3b8" />}
                    </Pressable>
                );
            })}
        </View>
    );
}
