import React from "react";
import { View, Text } from "react-native";
import { ACTIVITY_COLORS, TODAY_BORDER } from "features/home/utils/activityLevels";
import type { DayCell } from "features/home/utils/activityStats";

type StreakPanelProps = {
    streakDays: number;
    week: DayCell[]; // 7 cells, oldest -> today (today rightmost)
};

export default function StreakPanel({ streakDays, week }: StreakPanelProps) {
    return (
        <View>
            <Text className="font-sans-medium text-xs uppercase tracking-[2px] text-sand-dim">
                Current streak
            </Text>

            <View className="mt-2 flex-row items-baseline">
                <Text className="font-display-black text-[68px] leading-none text-sand">
                    {streakDays}
                </Text>
                <Text className="ml-2 font-display text-[30px] text-sand">
                    {streakDays === 1 ? "day" : "days"}
                </Text>
            </View>

            {/* Day-of-week header — one letter centered over each column. */}
            <View className="mt-6 flex-row gap-2">
                {week.map((cell, i) => (
                    <Text
                        key={i}
                        className="flex-1 text-center font-sans-medium text-[11px] text-sand-dim"
                    >
                        {cell.letter}
                    </Text>
                ))}
            </View>

            {/* Grid — every cell identical size via flex-1 + aspect-square. */}
            <View className="mt-2 flex-row gap-2">
                {week.map((cell, i) => {
                    // Today renders the dashed outline until it's done.
                    const showDashed = cell.isToday && !cell.done;
                    return (
                        <View
                            key={i}
                            className="aspect-square flex-1 rounded-[14px]"
                            style={
                                showDashed
                                    ? {
                                          borderWidth: 2,
                                          borderStyle: "dashed",
                                          borderColor: TODAY_BORDER,
                                          backgroundColor: "transparent",
                                      }
                                    : { backgroundColor: ACTIVITY_COLORS[cell.level] }
                            }
                        />
                    );
                })}
            </View>
        </View>
    );
}
