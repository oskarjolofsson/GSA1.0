import React from "react";
import { View, Text } from "react-native";
import { ACTIVITY_COLORS, TODAY_BORDER, ActivityLevel } from "features/home/utils/activityLevels";

// MVP PLACEHOLDER: static streak + week strip. Real values come from the
// /activity endpoint in a later wiring step. Do not treat these as real.
const STREAK_DAYS = 5;

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

// This week's activity. null = today (dashed outline, no level yet).
const WEEK: (ActivityLevel | null)[] = [2, 0, 2, 1, 0, 2, null];

export default function StreakPanel() {
    return (
        <View>
            <Text className="font-sans-medium text-xs uppercase tracking-[2px] text-sand-dim">
                Current streak
            </Text>

            <View className="mt-2 flex-row items-baseline">
                <Text className="font-display-black text-[68px] leading-none text-sand">
                    {STREAK_DAYS}
                </Text>
                <Text className="ml-2 font-display text-[30px] text-sand">days</Text>
            </View>

            {/* Day-of-week header — one letter centered over each column. */}
            <View className="mt-6 flex-row gap-2">
                {DAY_LETTERS.map((letter, i) => (
                    <Text
                        key={i}
                        className="flex-1 text-center font-sans-medium text-[11px] text-sand-dim"
                    >
                        {letter}
                    </Text>
                ))}
            </View>

            {/* Grid — every cell identical size via flex-1 + aspect-square. */}
            <View className="mt-2 flex-row gap-2">
                {WEEK.map((level, i) => (
                    <View
                        key={i}
                        className="aspect-square flex-1 rounded-[14px]"
                        style={
                            level === null
                                ? {
                                      borderWidth: 2,
                                      borderStyle: "dashed",
                                      borderColor: TODAY_BORDER,
                                      backgroundColor: "transparent",
                                  }
                                : { backgroundColor: ACTIVITY_COLORS[level] }
                        }
                    />
                ))}
            </View>
        </View>
    );
}
