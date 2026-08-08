import { View, Text, Pressable } from "react-native";

import type { TaxonomyTerm } from "../services/taxonomyService";
import type { AreaStats } from "../hooks/useAreaStats";
import AreaMeta from "./AreaMeta";
import StaggerRow from "./StaggerRow";

type Props = {
    areas: TaxonomyTerm[];
    statsByArea: Record<string, AreaStats>;
    onSelect: (area: TaxonomyTerm) => void;
};

/** The library landing: the parts of the game, as hairline rules.
 *
 *  No area is ever greyed out. Emptiness is discovered one level in, where it is
 *  true -- which also means this screen renders from the taxonomy alone and does
 *  not wait on the issue catalog, nor on the stats below.
 *
 *  Each row carries the golfer's own history rather than a description. Five
 *  nouns every golfer already knows do not need subtitles, and the blurbs made
 *  five identical rows out of five different areas. */
export default function AreaGrid({ areas, statsByArea, onSelect }: Props) {
    return (
        <View className="mt-6">
            {areas.map((area, index) => {
                const stats = statsByArea[area.key];
                // No programs and no sessions ever. Also what every row looks like
                // on a brand-new account, and while the stats are still in flight,
                // so it has to read as an invitation rather than as an empty slot.
                const started = Boolean(stats && (stats.programs > 0 || stats.lastLabel));

                return (
                    <StaggerRow key={area.key} index={index}>
                        <Pressable
                            onPress={() => onSelect(area)}
                            accessibilityRole="button"
                            accessibilityLabel={accessibilityLabel(area.golfer_label, stats, started)}
                            className={`min-h-[64px] flex-row items-center py-4 active:opacity-70 ${
                                index === areas.length - 1 ? "" : "border-b border-white/[.07]"
                            }`}
                        >
                            <View className="flex-1">
                                <Text className="font-display text-[18px] leading-[22px] text-sand">
                                    {area.golfer_label}
                                </Text>
                                {started ? null : (
                                    <Text className="mt-1 text-[13px] leading-[18px] text-gold">
                                        Not started yet
                                    </Text>
                                )}
                            </View>
                            {started && stats ? <AreaMeta stats={stats} /> : null}
                        </Pressable>
                    </StaggerRow>
                );
            })}
        </View>
    );
}

/** The strip is decoration to a screen reader, so the row says its state in words. */
function accessibilityLabel(label: string, stats: AreaStats | undefined, started: boolean): string {
    if (!started || !stats) return `${label}. Not started yet`;
    const parts = [label];
    if (stats.programs > 0) {
        parts.push(stats.programs === 1 ? "1 open program" : `${stats.programs} open programs`);
    }
    if (stats.lastLabel) parts.push(`last practised ${stats.lastLabel}`);
    return parts.join(". ");
}
