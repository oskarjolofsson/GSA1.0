import { View, Text, Pressable } from "react-native";
import { TrendingUp, Wrench } from "lucide-react-native";

import { tapHaptic } from "features/shared/utils/haptics";
import type { LibraryKind } from "../hooks/useLibraryState";

type Props = {
    /** Whether this area has any catalogued content of that kind — an area can
     *  be skill-only or fault-only. */
    skillAvailable: boolean;
    faultAvailable: boolean;
    onSelect: (kind: LibraryKind) => void;
};

const OPTIONS: { kind: LibraryKind; label: string; blurb: string; Icon: typeof TrendingUp; gold: boolean }[] = [
    { kind: "skill", label: "Get better", blurb: "Build on what works", Icon: TrendingUp, gold: true },
    { kind: "fault", label: "Fix something", blurb: "Something's going wrong", Icon: Wrench, gold: false },
];

/** Same fork as the intro's goal step, one level under the area: get better at
 *  this area, or fix a specific issue in it. Two equal square cards, not two
 *  stacked gold pills, and a kind with nothing behind it still shows,
 *  disabled — hiding it would leave a one-card screen that reads as broken. */
export default function KindChoice({ skillAvailable, faultAvailable, onSelect }: Props) {
    const available: Record<LibraryKind, boolean> = { skill: skillAvailable, fault: faultAvailable };

    return (
        <View className="mt-2 flex-row items-center gap-3.5" style={{ aspectRatio: 2.4 }}>
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
                            <Icon size={24} color={gold && !disabled ? "#E4C892" : "#EADFC8"} strokeWidth={1.8} />
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
    );
}
