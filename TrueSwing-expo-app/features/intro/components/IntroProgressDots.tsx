import { View } from "react-native";

type Props = {
    /** Total pickable steps (area, goal, branch, focus — welcome isn't one). */
    total: number;
    /** 0-based index of the current step. */
    current: number;
};

/** One dot per step. Filled for the current step and every one already passed,
 *  hollow for what's ahead — sand tones only, so it doesn't compete with the
 *  gold budget the screen's own content spends. */
export default function IntroProgressDots({ total, current }: Props) {
    return (
        <View className="flex-row items-center justify-center gap-2">
            {Array.from({ length: total }, (_, index) => {
                const filled = index <= current;
                return (
                    <View
                        key={index}
                        className={`h-[7px] w-[7px] rounded-full ${
                            filled ? "bg-sand" : "border border-white/20"
                        }`}
                    />
                );
            })}
        </View>
    );
}
