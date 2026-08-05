import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

import type { TaxonomyTerm } from "../services/taxonomyService";

type Props = {
    areas: TaxonomyTerm[];
    onSelect: (area: TaxonomyTerm) => void;
};

/** The library landing (direction A2): the parts of the game, as hairline rules.
 *
 *  No area is ever greyed out. Emptiness is discovered one level in, where it is
 *  true -- which also means this screen renders from the taxonomy alone and does
 *  not wait on the issue catalog. */
export default function AreaGrid({ areas, onSelect }: Props) {
    return (
        <View className="mt-6">
            {areas.map((area, index) => (
                <Pressable
                    key={area.key}
                    onPress={() => onSelect(area)}
                    accessibilityRole="button"
                    className={`min-h-[60px] flex-row items-center py-4 active:opacity-70 ${
                        index === areas.length - 1 ? "" : "border-b border-white/[.07]"
                    }`}
                >
                    {/* Reserved 26px icon slot, stroked in gold and empty for now: area
                        icons are coming, and reserving the slot makes them a drop-in
                        rather than a re-layout of every row. */}
                    <View className="h-[26px] w-[26px] rounded-full border border-gold/60" />
                    <View className="ml-4 flex-1">
                        <Text className="font-display text-[18px] leading-[22px] text-sand">
                            {area.golfer_label}
                        </Text>
                        {area.blurb ? (
                            <Text className="mt-1 text-[13px] leading-[19px] text-sand-dim">{area.blurb}</Text>
                        ) : null}
                    </View>
                    <ChevronRight size={18} color="#8A8676" />
                </Pressable>
            ))}
        </View>
    );
}
