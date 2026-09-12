import { View, Text, Pressable } from "react-native";
import { TrendingUp, Wrench, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IntroHeader from "../components/IntroHeader";
import IntroButton from "../components/IntroButton";
import { tapHaptic } from "../utils/haptics";
import type { IntroIssue } from "../services/introCatalogService";

type Kind = IntroIssue["kind"];

type Props = {
    areaLabel: string;
    onSelect: (kind: Kind) => void;
    onBack: () => void;
    onSkip: () => void;
};

const OPTIONS: { kind: Kind; label: string; blurb: string; Icon: typeof TrendingUp }[] = [
    { kind: "skill", label: "Get better at it", blurb: "Build on what's already working", Icon: TrendingUp },
    { kind: "fault", label: "Fix an issue", blurb: "Something specific is going wrong", Icon: Wrench },
];

/** Step two: get better at this area, or fix a specific issue in it.
 *
 *  Two peer rows, not two stacked gold pills — DESIGN.md caps gold fill at one
 *  genuinely primary action per screen, and two full-width CTAs asking the
 *  golfer to read both labels to tell them apart was the opposite of "don't
 *  make me think". The icon carries the distinction before the text does. */
export default function IntroGoalScreen({ areaLabel, onSelect, onBack, onSkip }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
            <View className="flex-1 px-5 pt-2">
                <IntroHeader eyebrow={areaLabel} heading={"What are you\nhere for?"} onBack={onBack} />

                <View className="mt-8">
                    {OPTIONS.map(({ kind, label, blurb, Icon }, index) => (
                        <Pressable
                            key={kind}
                            onPress={() => {
                                tapHaptic();
                                onSelect(kind);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={label}
                            className={`min-h-[72px] flex-row items-center py-4 active:opacity-70 ${
                                index === OPTIONS.length - 1 ? "" : "border-b border-white/[.07]"
                            }`}
                        >
                            <View className="mr-4 h-[40px] w-[40px] items-center justify-center rounded-full border border-gold/40">
                                <Icon size={18} color="#E4C892" />
                            </View>
                            <View className="flex-1 pr-3">
                                <Text className="font-display text-[18px] leading-[22px] text-sand">
                                    {label}
                                </Text>
                                <Text className="mt-1 text-[13px] leading-[18px] text-sand-dim">
                                    {blurb}
                                </Text>
                            </View>
                            <ChevronRight size={16} color="#8A8676" />
                        </Pressable>
                    ))}
                </View>
            </View>

            <View className="px-5" style={{ paddingBottom: insets.bottom + 12 }}>
                <IntroButton label="Skip for now" onPress={onSkip} tone="quiet" />
            </View>
        </View>
    );
}
