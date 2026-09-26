import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Header from "features/shared/components/Header";
import Button from "features/shared/components/Button";
import IntroAreaList from "../components/IntroAreaList";
import type { IntroArea } from "../services/introCatalogService";
import colors from "lib/colors";

type Props = {
    areas: IntroArea[];
    status: "loading" | "ready" | "error";
    error: string | null;
    onRetry: () => void;
    onSelect: (area: IntroArea) => void;
    onBack: () => void;
    onSkip: () => void;
};

export default function IntroAreaScreen({
    areas,
    status,
    error,
    onRetry,
    onSelect,
    onBack,
    onSkip,
}: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1" style={{ paddingTop: insets.top }}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
            >
                <Header eyebrow="First focus" heading={"Where do you\nlose shots?"} onBack={onBack} />

                <View className="flex-1 justify-center">
                    {status === "loading" ? (
                        <View className="items-center">
                            <ActivityIndicator color={colors.gold} />
                        </View>
                    ) : null}

                    {status === "error" ? (
                        <View>
                            <Text className="text-[15px] leading-[22px] text-sand">
                                We couldn&apos;t load the practice areas.
                            </Text>
                            {error ? (
                                <Text className="mt-2 text-[13px] leading-[19px] text-sand-dim">{error}</Text>
                            ) : null}
                            <View className="mt-6">
                                <Button label="Try again" onPress={onRetry} />
                            </View>
                        </View>
                    ) : null}

                    {status === "ready" ? <IntroAreaList areas={areas} onSelect={onSelect} /> : null}
                </View>
            </ScrollView>

            <View className="px-5" style={{ paddingBottom: insets.bottom + 12 }}>
                <Button label="Skip for now" onPress={onSkip} tone="quiet" />
            </View>
        </View>
    );
}
