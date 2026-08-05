import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronRight, Camera } from "lucide-react-native";

import type { AreaFork } from "../utils/libraryFork";
import type { TaxonomyMiss, TaxonomyTerm } from "../services/taxonomyService";

type Props = {
    fork: AreaFork;
    /** Gates the film hand-off; see the comment on the render condition below. */
    areaKey: string;
    onSelectMiss: (miss: TaxonomyMiss) => void;
    onSelectGoal: (goal: TaxonomyTerm) => void;
    onFilmSwing?: () => void;
};

/** Level two: the fork under one area. "Something's going wrong" leads to the
 *  area's misses, "nothing's broken" to its goals, and the two carry equal
 *  weight -- a golfer with nothing acutely broken still wants drills, and a
 *  filter chip row would have made that path a decoration on someone else's
 *  screen. Both branches land on the same candidate list. */
export default function MissList({ fork, areaKey, onSelectMiss, onSelectGoal, onFilmSwing }: Props) {
    // The AI analysis prompt is area-scoped server-side and defaults to
    // FULL_SWING, so this render condition is what keeps the hand-off correct --
    // there is no analysis for a bunker shot. Relaxing it means threading the
    // chosen area through the upload flow first.
    const showFilm = Boolean(onFilmSwing) && areaKey === "FULL_SWING";

    return (
        <View>

            {fork.goals.length > 0 ? (
                <Branch label="Nothing's broken" question="Get better at:">
                    {fork.goals.map((goal, index) => (
                        <ForkRow
                            key={goal.key}
                            title={goal.golfer_label}
                            subtitle={goal.blurb}
                            last={index === fork.goals.length - 1}
                            onPress={() => onSelectGoal(goal)}
                        />
                    ))}
                </Branch>
            ) : null}

            {fork.misses.length > 0 && fork.goals.length > 0 ? (
                <View className="mt-8 h-px bg-white/[.13]" />
            ) : null}

            {fork.misses.length > 0 ? (
                <Branch label="Something's going wrong" question="Technical issues:">
                    {fork.misses.map((miss, index) => (
                        <ForkRow
                            key={miss.key}
                            title={miss.golfer_label}
                            subtitle={miss.blurb}
                            last={index === fork.misses.length - 1}
                            onPress={() => onSelectMiss(miss)}
                        />
                    ))}
                </Branch>
            ) : null}

            {showFilm ? (
                <Pressable
                    onPress={onFilmSwing}
                    accessibilityRole="button"
                    className="mt-7 min-h-[44px] flex-row items-center border-t border-white/[.07] pt-5 active:opacity-70"
                >
                    <Camera size={16} color="#8A8676" />
                    <Text className="ml-3 flex-1 text-[13px] leading-[19px] text-sand-dim">
                        Not sure? Film your swing and let the AI find it
                    </Text>
                </Pressable>
            ) : null}
        </View>
    );
}

function Branch({ label, question, children }: { label: string; question: string; children: ReactNode }) {
    return (
        <View className="mt-7">
            {/* <Text className="text-[10px] uppercase tracking-[2.6px] text-gold">{label}</Text> */}
            <Text className="mt-2 font-display text-[23px] text-gold text-center ">{question}</Text>
            <View className="mt-2">{children}</View>
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
            <ChevronRight size={16} color="#8A8676" />
        </Pressable>
    );
}
