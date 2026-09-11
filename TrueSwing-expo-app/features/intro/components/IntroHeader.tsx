import { View, Text, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";

type Props = {
    eyebrow: string;
    heading: string;
    /** Omitted on the first step, which has nowhere to go back to. */
    onBack?: () => void;
};

/** The eyebrow-and-serif-heading pair the library uses, so the intro and the app
 *  the golfer lands in are visibly the same product. */
export default function IntroHeader({ eyebrow, heading, onBack }: Props) {
    return (
        <View>
            <View className="min-h-[44px] flex-row items-center">
                {onBack ? (
                    <Pressable
                        onPress={onBack}
                        accessibilityRole="button"
                        className="min-h-[44px] flex-row items-center pr-3 active:opacity-70"
                    >
                        <ChevronLeft size={16} color="#8A8676" />
                        <Text className="ml-1 text-[13px] text-sand-dim">Back</Text>
                    </Pressable>
                ) : null}
            </View>

            <Text className="mt-4 text-[10px] uppercase tracking-[2.6px] text-gold">{eyebrow}</Text>
            <Text className="mt-3 font-display text-[29px] leading-[33px] text-sand">{heading}</Text>
        </View>
    );
}
