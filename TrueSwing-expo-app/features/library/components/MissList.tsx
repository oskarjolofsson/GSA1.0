import { View, Text, Pressable } from "react-native";
import { ChevronRight, Camera } from "lucide-react-native";

import type { TaxonomyMiss, TaxonomyTerm } from "../services/taxonomyService";
import StaggerRow from "./StaggerRow";
import colors from "lib/colors";

type Props = {
    items: (TaxonomyMiss | TaxonomyTerm)[];
    /** Gates the film hand-off; see the comment on the render condition below. */
    areaKey: string;
    onSelect: (item: TaxonomyMiss | TaxonomyTerm) => void;
    onFilmSwing?: () => void;
};

/** Level three: the area's misses or goals, one branch at a time -- the outer
 *  header already states which ("What's the goal?" / "What does it look
 *  like?"), so this is a flat list of rows, same shape as intro's branch
 *  screen. */
export default function MissList({ items, areaKey, onSelect, onFilmSwing }: Props) {
    // The AI analysis prompt is area-scoped server-side and defaults to
    // FULL_SWING, so this render condition is what keeps the hand-off correct --
    // there is no analysis for a bunker shot. Relaxing it means threading the
    // chosen area through the upload flow first.
    const showFilm = Boolean(onFilmSwing) && areaKey === "FULL_SWING";

    return (
        <View>
            {items.map((item, index) => (
                <StaggerRow key={item.key} index={index}>
                    <ForkRow
                        title={item.golfer_label}
                        subtitle={item.blurb}
                        last={index === items.length - 1}
                        onPress={() => onSelect(item)}
                    />
                </StaggerRow>
            ))}

            {showFilm ? (
                <StaggerRow index={items.length}>
                    <Pressable
                        onPress={onFilmSwing}
                        accessibilityRole="button"
                        className="mt-7 min-h-[44px] flex-row items-center border-t border-white/[.07] pt-5 active:opacity-70"
                    >
                        <Camera size={16} color={colors['sand-dim']} />
                        <Text className="ml-3 flex-1 text-[13px] leading-[19px] text-sand-dim">
                            Not sure? Film your swing and let the AI find it
                        </Text>
                    </Pressable>
                </StaggerRow>
            ) : null}
        </View>
    );
}

function ForkRow({
    title,
    subtitle,
    last,
    onPress,
}: {
    title: string;
    subtitle?: string | null;
    last: boolean;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            className={`min-h-[52px] flex-row items-center py-3.5 active:opacity-70 ${
                last ? "" : "border-b border-white/[.07]"
            }`}
        >
            <View className="flex-1">
                <Text className="font-sans-medium text-[15px] text-sand">{title}</Text>
                {subtitle ? (
                    <Text className="mt-1 text-[13px] leading-[18px] text-sand-dim">{subtitle}</Text>
                ) : null}
            </View>
            <ChevronRight size={16} color={colors['sand-dim']} />
        </Pressable>
    );
}
