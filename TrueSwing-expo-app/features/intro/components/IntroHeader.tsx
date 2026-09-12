import { View, Text, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";

import { tapHaptic } from "../utils/haptics";

const BACK_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

type Props = {
    eyebrow: string;
    heading: string;
    /** Omitted on the first step, which has nowhere to go back to. */
    onBack?: () => void;
};

/** The eyebrow-and-serif-heading pair the library uses, so the intro and the app
 *  the golfer lands in are visibly the same product.
 *
 *  3-column nav bar: back glyph, then a matching blank spacer on the right, so
 *  the title centers against the full width rather than just the space left
 *  after the back glyph — the treatment approved on the goal screen, now the
 *  one header every step shares instead of two implementations. */
export default function IntroHeader({ eyebrow, heading, onBack }: Props) {
    return (
        <View>
            {onBack ? (
                <View className="flex-row items-center">
                    <Pressable
                        onPress={() => {
                            tapHaptic();
                            onBack();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                        hitSlop={BACK_HIT_SLOP}
                        className="min-h-[44px] w-8 justify-center active:opacity-70"
                    >
                        <ChevronLeft size={22} color="#8A8676" />
                    </Pressable>
                    <View className="flex-1" />
                    <View className="w-8" />
                </View>
            ) : null}

            <View className="mt-4 items-center px-3">
                <Text className="text-[10px] uppercase tracking-[2.6px] text-gold">{eyebrow}</Text>
                <Text className="mt-3 text-center font-display text-[29px] leading-[33px] text-sand">
                    {heading}
                </Text>
            </View>
        </View>
    );
}
