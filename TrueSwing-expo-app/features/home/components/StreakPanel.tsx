import React from "react";
import { View, Text, type LayoutChangeEvent } from "react-native";
import { MotiView } from "moti";
import { useReducedMotion } from "react-native-reanimated";
import { ACTIVITY_COLORS, TODAY_BORDER } from "features/home/utils/activityLevels";
import type { DayCell } from "features/home/utils/activityStats";
import { HOME_ANIM } from "features/home/animations";

type StreakPanelProps = {
    streakDays: number;
    /** 28 cells: two rows of fourteen, newest fortnight first. */
    month: DayCell[];
};

const COLUMNS = 14;
const GAP = 3;

/**
 * How consistent the golfer has been, as texture: two rows of fourteen days, newest
 * fortnight first, today in the last cell. Read-only -- see ADR-0024.
 */
export default function StreakPanel({ streakDays, month }: StreakPanelProps) {
    const reduceMotion = useReducedMotion();
    const doneCount = month.filter((cell) => cell.done).length;

    // 0 until the first layout pass; the cells simply do not render for that one frame.
    const [gridWidth, setGridWidth] = React.useState(0);
    const onLayout = React.useCallback((e: LayoutChangeEvent) => {
        setGridWidth(e.nativeEvent.layout.width);
    }, []);

    // Measured and floored to a whole pixel, NOT `width: ${100/14}%`: Yoga rounds each
    // percentage cell up to the pixel grid, so fourteen of them no longer fit inside 100%
    // and the row wraps. The leftover (up to ~13px) is spread back by `space-between`.
    const cell = gridWidth > 0 ? Math.floor((gridWidth - GAP * (COLUMNS - 1)) / COLUMNS) : 0;

    // Derived rather than hardcoded to two, so widening the window cannot desync this.
    const rows = React.useMemo(() => {
        const out: DayCell[][] = [];
        for (let i = 0; i < month.length; i += COLUMNS) {
            out.push(month.slice(i, i + COLUMNS));
        }
        return out;
    }, [month]);

    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Current streak ${streakDays} ${
                streakDays === 1 ? "day" : "days"
            }. Practised ${doneCount} of the last ${month.length} days.`}
        >
            <View className="flex-row items-baseline justify-between">
                <Text className="font-sans-semibold text-[11px] uppercase tracking-[2.5px] text-sand-dim">
                    Streak
                </Text>
                <Text className="text-[13px] text-sand-dim">
                    <Text className="font-display text-[15px] text-sand">{streakDays}</Text>
                    {streakDays === 1 ? " day" : " days"}
                </Text>
            </View>

            {/* One explicit row per fortnight, NOT flexWrap. Yoga decides how many
                children fit from their widths alone and spreads leftover space only
                afterwards, so a wrapping grid packs fifteen or sixteen per line. */}
            <View
                onLayout={onLayout}
                className="mt-2.5"
                style={{ rowGap: GAP }}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            >
                {cell > 0
                    ? rows.map((fortnight, rowIndex) => (
                          <View key={rowIndex} className="flex-row justify-between">
                              {fortnight.map((day, i) => {
                                  const showDashed = day.isToday && !day.done;
                                  return (
                                      <MotiView
                                          key={day.date}
                                          from={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{
                                              type: "timing",
                                              duration: reduceMotion ? 0 : 240,
                                              delay: reduceMotion
                                                  ? 0
                                                  : (rowIndex * COLUMNS + i) *
                                                    HOME_ANIM.gridCellStep,
                                          }}
                                          style={[
                                              { width: cell, height: cell, borderRadius: 4 },
                                              showDashed
                                                  ? {
                                                        borderWidth: 1,
                                                        borderStyle: "dashed",
                                                        borderColor: TODAY_BORDER,
                                                        backgroundColor: "transparent",
                                                    }
                                                  : {
                                                        backgroundColor:
                                                            ACTIVITY_COLORS[day.level],
                                                    },
                                          ]}
                                      />
                                  );
                              })}
                          </View>
                      ))
                    : null}
            </View>

            {/* "Four weeks", not "two": each ROW is a fortnight. */}
            <Text className="mt-3 text-[13px] leading-[18px] text-sand-dim">
                Each square is a day you practised, over the last four weeks.
            </Text>
        </View>
    );
}
