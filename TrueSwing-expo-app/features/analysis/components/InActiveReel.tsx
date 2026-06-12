import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Analysis } from "features/analysis/types";

const { width, height } = Dimensions.get("window");

export default function InactiveAnalysisReel({
    reelIndex,
    totalAnalyses,
}: {
    reelIndex: number;
    totalAnalyses: number;
}) {
    return (
        <View style={{ width, height }} className="bg-black">
            <LinearGradient
                colors={["#050816", "#0B0D12", "#050816"]}
                style={{ position: "absolute", inset: 0 }}
            />

            <SafeAreaView className="flex-1" style={{ flex: 1 }}>
                <View className="flex-1 justify-between px-5 pb-8 pt-3">
                    <View className="flex-row items-center justify-between">
                        <View className="rounded-full border border-white/10 bg-black/25 px-4 py-2">
                            <Text className="text-sm text-white">
                                Analysis {reelIndex + 1} / {totalAnalyses}
                            </Text>
                        </View>
                    </View>

                    <View className="rounded-[28px] border border-white/10 bg-black/35 p-5">
                        <Text className="text-zinc-300">
                            Swipe to load this analysis
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}