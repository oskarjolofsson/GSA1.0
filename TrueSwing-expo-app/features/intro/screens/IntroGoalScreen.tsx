import { View, Text, Pressable } from "react-native";
import { TrendingUp, Wrench } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IntroHeader from "../components/IntroHeader";
import IntroButton from "../components/IntroButton";
import { tapHaptic } from "../utils/haptics";
import type { IntroIssue } from "../services/introCatalogService";

type Kind = IntroIssue["kind"];

type Props = {
    areaLabel: string;
    /** Whether this area has any catalogued content of that kind — an area can
     *  be skill-only (e.g. pitching, today) or fault-only. */
    skillAvailable: boolean;
    faultAvailable: boolean;
    onSelect: (kind: Kind) => void;
    onBack: () => void;
    onSkip: () => void;
};

const OPTIONS: { kind: Kind; label: string; blurb: string; Icon: typeof TrendingUp; gold: boolean }[] = [
    { kind: "skill", label: "Get better", blurb: "Build on what works", Icon: TrendingUp, gold: true },
    { kind: "fault", label: "Fix something", blurb: "Something's going wrong", Icon: Wrench, gold: false },
];

/** Step two: get better at this area, or fix a specific issue in it.
 *
 *  Two equal square cards, not two stacked gold pills — DESIGN.md caps gold
 *  fill at one genuinely primary action per screen, and two full-width CTAs
 *  asking the golfer to read both labels to tell them apart was the opposite
 *  of "don't make me think". The icon carries the distinction before the text
 *  does; tapping either card advances immediately, no separate confirm step.
 *
 *  A kind with nothing behind it in this area still shows, disabled and
 *  labelled "Coming soon" — hiding it would leave a one-card screen that
 *  reads as broken, and a golfer who taps a hidden option gets no feedback
 *  at all. */
export default function IntroGoalScreen({
    areaLabel,
    skillAvailable,
    faultAvailable,
    onSelect,
    onBack,
    onSkip,
}: Props) {
    const insets = useSafeAreaInsets();
    const available: Record<Kind, boolean> = { skill: skillAvailable, fault: faultAvailable };

    return (
        <View className="flex-1" style={{ paddingTop: insets.top }}>
            <View className="flex-1 px-5 pt-2">
                <IntroHeader eyebrow={areaLabel} heading={"What are you\nhere for?"} onBack={onBack} />

                <View className="flex-1 flex-row items-center gap-3.5">
                    {OPTIONS.map(({ kind, label, blurb, Icon, gold }) => {
                        const disabled = !available[kind];

                        return (
                            <Pressable
                                key={kind}
                                onPress={() => {
                                    if (disabled) return;
                                    tapHaptic();
                                    onSelect(kind);
                                }}
                                disabled={disabled}
                                accessibilityRole="button"
                                accessibilityLabel={label}
                                accessibilityState={{ disabled }}
                                style={{ aspectRatio: 1 }}
                                className={`flex-1 items-center justify-center gap-3 rounded-[20px] border border-white/[.14] p-4 ${
                                    disabled ? "opacity-40" : "active:opacity-70"
                                }`}
                            >
                                <View
                                    className={`h-[52px] w-[52px] items-center justify-center rounded-full ${
                                        gold && !disabled ? "bg-gold/10" : "bg-white/[.06]"
                                    }`}
                                >
                                    <Icon
                                        size={24}
                                        color={gold && !disabled ? "#E4C892" : "#EADFC8"}
                                        strokeWidth={1.8}
                                    />
                                </View>
                                <Text className="text-center font-display text-[17px] leading-[21px] text-sand">
                                    {label}
                                </Text>
                                <Text className="text-center text-[12px] leading-[16px] text-sand-dim">
                                    {disabled ? "Coming soon" : blurb}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <View className="px-5" style={{ paddingBottom: insets.bottom + 12 }}>
                <IntroButton label="Skip for now" onPress={onSkip} tone="quiet" />
            </View>
        </View>
    );
}
