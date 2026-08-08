import { View, Text } from "react-native";

import type { AreaStats } from "../hooks/useAreaStats";

/** Bar height per session count, index = count clamped to 3. The floor tick is
 *  the 0 case: rest days render, they just render low. */
const BAR_HEIGHTS = [3, 7, 11, 15];
const BAR_COLOR = "#D2B271"; // gold-deep
const FLOOR_COLOR = "rgba(255,255,255,0.07)";

/** Slots the backend allows per area (ProgramSummary.slot is 0 or 1). Two dots
 *  works precisely because the count is bounded -- if the cap ever lifts, this
 *  has to become a number. */
const PROGRAM_SLOTS = 2;

export default function AreaMeta({ stats }: { stats: AreaStats }) {
    return (
        <View className="ml-3.5 items-end">
            {stats.programs > 0 ? (
                <View className="flex-row gap-1">
                    {Array.from({ length: PROGRAM_SLOTS }).map((_, slot) => (
                        <View
                            key={slot}
                            className={`h-[6px] w-[6px] rounded-full ${
                                slot < stats.programs ? "bg-gold" : "bg-white/[.14]"
                            }`}
                        />
                    ))}
                </View>
            ) : null}

            {stats.days.length > 0 ? (
                <View className="mt-[7px] h-[15px] flex-row items-end gap-[2.5px]">
                    {stats.days.map((count, day) => (
                        <View
                            key={day}
                            className="w-[5px] rounded-[1.5px]"
                            style={{
                                height: BAR_HEIGHTS[Math.min(count, 3)],
                                backgroundColor: count > 0 ? BAR_COLOR : FLOOR_COLOR,
                            }}
                        />
                    ))}
                </View>
            ) : null}

            {stats.lastLabel ? (
                <Text className="mt-[7px] text-[11px] leading-[12px] text-sand-dim">
                    {stats.lastLabel}
                </Text>
            ) : null}
        </View>
    );
}
