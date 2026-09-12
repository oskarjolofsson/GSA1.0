import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";

import { tapHaptic } from "../utils/haptics";

const BACK_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Props = {
    eyebrow: string;
    heading: string;
    /** Omitted on the first step of a flow, which has nowhere to go back to. */
    onBack?: () => void;
    /** Text next to the back chevron (e.g. "Back"). Icon-only when omitted. */
    backLabel?: string;
    /** Content on the right of the nav row (e.g. a search icon). Defaults to a
     *  blank spacer matching the back glyph's width, which keeps a centered
     *  heading centered against the full row rather than the space left of it. */
    rightSlot?: ReactNode;
    /** "center" for a single-column flow (intro); "left" for a screen with its
     *  own scroll content sitting flush against the same margin (library). */
    align?: "center" | "left";
};

/** The eyebrow-and-serif-heading pair used across the intro and the library, so
 *  every step of picking a focus looks like the same product. */
export default function Header({
    eyebrow,
    heading,
    onBack,
    backLabel,
    rightSlot,
    align = "center",
}: Props) {
    return (
        <View>
            {onBack ? (
                <View className="min-h-[44px] flex-row items-center justify-between">
                    <Pressable
                        onPress={() => {
                            tapHaptic();
                            onBack();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                        hitSlop={BACK_HIT_SLOP}
                        className={
                            backLabel
                                ? "min-h-[44px] flex-row items-center pr-3 active:opacity-70"
                                : "min-h-[44px] w-8 justify-center active:opacity-70"
                        }
                    >
                        <ChevronLeft size={backLabel ? 16 : 22} color="#8A8676" />
                        {backLabel ? (
                            <Text className="ml-1 text-[13px] text-sand-dim">{backLabel}</Text>
                        ) : null}
                    </Pressable>
                    {rightSlot ?? <View className="w-8" />}
                </View>
            ) : null}

            <View className={align === "center" ? "mt-4 items-center px-3" : "mt-4"}>
                <Text className="text-[10px] uppercase tracking-[2.6px] text-gold">{eyebrow}</Text>
                <Text
                    className={
                        align === "center"
                            ? "mt-3 text-center font-display text-[29px] leading-[33px] text-sand"
                            : "mt-3 font-display text-[29px] leading-[33px] text-sand"
                    }
                >
                    {heading}
                </Text>
            </View>
        </View>
    );
}
