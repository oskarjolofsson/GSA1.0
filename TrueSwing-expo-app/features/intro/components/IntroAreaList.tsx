import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { tapHaptic } from "../utils/haptics";
import type { IntroArea } from "../services/introCatalogService";

type Props = {
    areas: IntroArea[];
    onSelect: (area: IntroArea) => void;
};

/**
 * The parts of the game, as hairline rules — the library's landing, minus its
 * history column.
 *
 * `AreaGrid` is deliberately not reused here despite the near-identical shape.
 * Every row of that one says "Not started yet" until the golfer's stats arrive,
 * which is true and useful inside the app and reads as five failures to someone
 * who has not signed up yet. This one carries the area's blurb instead.
 */
export default function IntroAreaList({ areas, onSelect }: Props) {
    return (
        <View className="mt-6">
            {areas.map((area, index) => (
                <Pressable
                    key={area.key}
                    onPress={() => {
                        tapHaptic();
                        onSelect(area);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={area.golfer_label}
                    className={`min-h-[64px] flex-row items-center py-4 active:opacity-70 ${
                        index === areas.length - 1 ? "" : "border-b border-white/[.07]"
                    }`}
                >
                    <View className="flex-1 pr-3">
                        <Text className="font-display text-[18px] leading-[22px] text-sand">
                            {area.golfer_label}
                        </Text>
                        {area.blurb ? (
                            <Text className="mt-1 text-[13px] leading-[18px] text-sand-dim">
                                {area.blurb}
                            </Text>
                        ) : null}
                    </View>
                    <ChevronRight size={16} color="#8A8676" />
                </Pressable>
            ))}
        </View>
    );
}
