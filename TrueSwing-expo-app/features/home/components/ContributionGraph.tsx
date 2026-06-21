import React from "react";
import { View, Text } from "react-native";
import { Flame } from "lucide-react-native";

// MVP PLACEHOLDER: static squares + streak. Real data comes from the /activity
// endpoint in a later wiring step. Do not treat these values as real.
const WEEKS = 12;
const DAYS = 7;
const STREAK = 5;

// Deterministic pseudo-fill so the grid looks lived-in without real data.
function placeholderLevel(week: number, day: number): number {
    const seed = (week * 7 + day * 3) % 5;
    return seed; // 0 = empty, 1..4 = increasing intensity
}

const LEVEL_CLASS = [
    "bg-white/5",
    "bg-emerald-900",
    "bg-emerald-700",
    "bg-emerald-500",
    "bg-emerald-400",
];

export default function ContributionGraph() {
    return (
        <View className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-semibold text-white">Your activity</Text>
                <View className="flex-row items-center gap-1.5">
                    <Flame size={18} color="#fb923c" />
                    <Text className="text-sm font-semibold text-orange-400">
                        {STREAK} day streak
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between">
                {Array.from({ length: WEEKS }).map((_, week) => (
                    <View key={week} className="gap-1">
                        {Array.from({ length: DAYS }).map((__, day) => (
                            <View
                                key={day}
                                className={`h-4 w-4 rounded-[4px] ${LEVEL_CLASS[placeholderLevel(week, day)]}`}
                            />
                        ))}
                    </View>
                ))}
            </View>
        </View>
    );
}
