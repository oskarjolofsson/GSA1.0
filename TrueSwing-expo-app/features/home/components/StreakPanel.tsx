import React from "react";
import { View, Text, Pressable } from "react-native";
import { MotiView } from "moti";
import { useReducedMotion } from "react-native-reanimated";
import { ACTIVITY_COLORS, TODAY_BORDER } from "features/home/utils/activityLevels";
import type { DayCell } from "features/home/utils/activityStats";
import useCountUp from "features/home/hooks/useCountUp";
import { HOME_ANIM } from "features/home/animations";

type StreakPanelProps = {
    streakDays: number;
    week: DayCell[]; // 7 cells, oldest -> today (today rightmost)
    onDayPress: (date: string, hasActivity: boolean) => void;
};

export default function StreakPanel({ streakDays, week, onDayPress }: StreakPanelProps) {
    const reduceMotion = useReducedMotion();
    const displayStreak = useCountUp(streakDays, HOME_ANIM.countUp, HOME_ANIM.countUpDelay);

    return (
        <View>
            <Text className="font-sans-medium text-xs uppercase tracking-[2px] text-sand-dim">
                Current streak
            </Text>

            <View className="mt-2 flex-row items-baseline">
                <Text className="font-display-black text-[68px] leading-none text-sand">
                    {displayStreak}
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

            {/* Grid — every cell identical size via flex-1 + aspect-square. Cells
                stagger in left-to-right on mount. */}
            <View className="mt-2 flex-row gap-2">
                {week.map((cell, i) => {
                    // Today renders the dashed outline until it's done.
                    const showDashed = cell.isToday && !cell.done;
                    return (
                        <MotiView
                            key={i}
                            className="aspect-square flex-1"
                            from={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                type: "timing",
                                duration: reduceMotion ? 0 : 260,
                                delay: reduceMotion ? 0 : i * HOME_ANIM.gridCellStep,
                            }}
                        >
                            <Pressable
                                onPress={() => onDayPress(cell.date, cell.done)}
                                accessibilityRole="button"
                                accessibilityLabel={`Activity for ${cell.date}`}
                                className="h-full w-full rounded-[14px] active:opacity-70"
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
                        </MotiView>
                    );
                })}
            </View>
        </View>
    );
}
