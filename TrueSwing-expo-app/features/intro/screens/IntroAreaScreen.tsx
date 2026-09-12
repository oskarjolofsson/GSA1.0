import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IntroHeader from "../components/IntroHeader";
import IntroButton from "../components/IntroButton";
import IntroAreaList from "../components/IntroAreaList";
import type { IntroArea } from "../services/introCatalogService";

type Props = {
    areas: IntroArea[];
    status: "loading" | "ready" | "error";
    error: string | null;
    onRetry: () => void;
    onSelect: (area: IntroArea) => void;
    onBack: () => void;
    /** Straight to sign-up without picking. Always available — see below. */
    onSkip: () => void;
};

/** Step one: which part of the game. The library's own first question, asked
 *  before the account exists. */
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
        <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}
            >
                <IntroHeader eyebrow="First focus" heading={"Where do you\nlose shots?"} onBack={onBack} />

                <View className="flex-1 justify-center">
                    {status === "loading" ? (
                        <View className="items-center">
                            <ActivityIndicator color="#E4C892" />
                        </View>
                    ) : null}

                    {/* Inline, not a full-screen error: this screen is optional, and a
                        golfer who cannot reach the server must still be able to walk
                        past it to sign up. Blocking here would make an outage look
                        like an app that does not open. */}
                    {status === "error" ? (
                        <View>
                            <Text className="text-[15px] leading-[22px] text-sand">
                                We couldn&apos;t load the practice areas.
                            </Text>
                            {error ? (
                                <Text className="mt-2 text-[13px] leading-[19px] text-sand-dim">{error}</Text>
                            ) : null}
                            <View className="mt-6">
                                <IntroButton label="Try again" onPress={onRetry} />
                            </View>
                        </View>
                    ) : null}

                    {status === "ready" ? <IntroAreaList areas={areas} onSelect={onSelect} /> : null}
                </View>
            </ScrollView>

            <View className="px-5" style={{ paddingBottom: insets.bottom + 12 }}>
                <IntroButton label="Skip for now" onPress={onSkip} tone="quiet" />
            </View>
        </View>
    );
}
