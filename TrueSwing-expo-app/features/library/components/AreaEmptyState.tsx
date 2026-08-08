import { View, Text, Pressable } from "react-native";

import StaggerRow from "./StaggerRow";

type Props = {
    /** Golfer-facing area name, so the screen names the thing it is empty of. */
    areaLabel: string;
    onBack: () => void;
};

/** Nothing authored for this area yet. A designed screen rather than a stray
 *  <Text>, because no area is greyed out on the landing -- this is where a
 *  golfer finds out, and it costs them a tap to get here.
 *
 *  Staggered like every other library view, so arriving at nothing still feels
 *  like arriving somewhere. */
export default function AreaEmptyState({ areaLabel, onBack }: Props) {
    return (
        <View className="mt-24 items-center px-3">
            <StaggerRow index={0}>
                <View className="h-px w-[26px] bg-gold" />
            </StaggerRow>
            <StaggerRow index={1}>
                <Text className="mt-6 font-display text-[21px] text-sand">Nothing here yet</Text>
            </StaggerRow>
            <StaggerRow index={2}>
                <Text className="mt-3 text-center text-[13px] leading-[21px] text-sand-dim">
                    {areaLabel} work is being written. The rest of your game is ready to practise today.
                </Text>
            </StaggerRow>
            <StaggerRow index={3}>
                <Pressable
                    onPress={onBack}
                    accessibilityRole="button"
                    className="mt-7 min-h-[44px] justify-center active:opacity-70"
                >
                    <Text className="border-b border-gold/40 pb-1.5 text-[13px] uppercase tracking-[1.6px] text-gold">
                        Pick another area
                    </Text>
                </Pressable>
            </StaggerRow>
        </View>
    );
}
