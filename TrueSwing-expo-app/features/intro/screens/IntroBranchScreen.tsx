import { View, Text, ScrollView, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Header from "features/shared/components/Header";
import Button from "features/shared/components/Button";
import { tapHaptic } from "features/shared/utils/haptics";
import type { IntroBranch, IntroIssue } from "../services/introCatalogService";
import colors from "lib/colors";

type Props = {
    areaLabel: string;
    kind: IntroIssue["kind"];
    branches: IntroBranch[];
    onSelect: (branch: IntroBranch) => void;
    onBack: () => void;
    onSkip: () => void;
};

/** Step three: the same fork the signed-in library navigates one level under an
 *  area — which miss ("fix an issue") or which goal ("get better") — before the
 *  focus list narrows to it. */
export default function IntroBranchScreen({
    areaLabel,
    kind,
    branches,
    onSelect,
    onBack,
    onSkip,
}: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1" style={{ paddingTop: insets.top }}>
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
            >
                <Header
                    eyebrow={areaLabel}
                    heading={kind === "skill" ? "What's the\ngoal?" : "What does it\nlook like?"}
                    onBack={onBack}
                />

                <View className="mt-6">
                    {branches.map((branch, index) => (
                        <Pressable
                            key={branch.key}
                            onPress={() => {
                                tapHaptic();
                                onSelect(branch);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={branch.golfer_label}
                            className={`min-h-[64px] flex-row items-center py-4 active:opacity-70 ${
                                index === branches.length - 1 ? "" : "border-b border-white/[.07]"
                            }`}
                        >
                            <View className="flex-1 pr-3">
                                <Text className="font-display text-[18px] leading-[22px] text-sand">
                                    {branch.golfer_label}
                                </Text>
                                {branch.blurb ? (
                                    <Text className="mt-1 text-[13px] leading-[18px] text-sand-dim">
                                        {branch.blurb}
                                    </Text>
                                ) : null}
                            </View>
                            <ChevronRight size={16} color={colors['sand-dim']} />
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            <View className="px-5" style={{ paddingBottom: insets.bottom + 12 }}>
                <Button label="Skip for now" onPress={onSkip} tone="quiet" />
            </View>
        </View>
    );
}
