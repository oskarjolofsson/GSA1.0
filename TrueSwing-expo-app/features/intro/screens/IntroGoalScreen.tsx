import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IntroHeader from "../components/IntroHeader";
import IntroButton from "../components/IntroButton";
import type { IntroIssue } from "../services/introCatalogService";

type Kind = IntroIssue["kind"];

type Props = {
    areaLabel: string;
    onSelect: (kind: Kind) => void;
    onBack: () => void;
    onSkip: () => void;
};

/** Step two: get better at this area, or fix a specific issue in it. Narrows
 *  the next screen's focus list to one `kind` (`skill` | `fault`) instead of
 *  mixing both under one heading. */
export default function IntroGoalScreen({ areaLabel, onSelect, onBack, onSkip }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
            <View className="flex-1 px-5 pt-2">
                <IntroHeader eyebrow={areaLabel} heading={"What are you\nhere for?"} onBack={onBack} />

                <View className="mt-8">
                    <IntroButton label="Get better at it" onPress={() => onSelect("skill")} />
                    <View className="mt-3">
                        <Text className="text-center text-[12px] text-sand-dim">or</Text>
                    </View>
                    <View className="mt-3">
                        <IntroButton label="Fix an issue" onPress={() => onSelect("fault")} />
                    </View>
                </View>
            </View>

            <View className="px-5" style={{ paddingBottom: insets.bottom + 12 }}>
                <IntroButton label="Skip for now" onPress={onSkip} tone="quiet" />
            </View>
        </View>
    );
}
