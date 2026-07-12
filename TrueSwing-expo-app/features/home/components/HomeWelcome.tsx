import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";

type HomeWelcomeProps = {
    onStart: () => void;
};

// First-run empty state: shown when the user has no activity yet. Same design
// language as the home screen (deep navy field, sand ink, Fraunces, gold CTA).
export default function HomeWelcome({ onStart }: HomeWelcomeProps) {
    const insets = useSafeAreaInsets();

    return (
        <View
            className="flex-1 justify-center bg-ink px-6"
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
        >
            <Text className="font-sans-medium text-xs uppercase tracking-[2px] text-sand-dim">
                Welcome to TrueSwing
            </Text>

            <Text className="mt-3 font-display-bold text-[40px] leading-[44px] text-sand">
                Turn consistency into lower scores.
            </Text>

            <Text className="mt-4 font-sans text-base leading-relaxed text-sand-dim">
                Your streak starts with one focus. Film a swing, turn coach feedback into
                a plan, or browse the library — then build the daily habit.
            </Text>

            <Pressable
                onPress={onStart}
                className="mt-8 overflow-hidden rounded-2xl"
                style={{
                    shadowColor: "#E4C892",
                    shadowOpacity: 0.35,
                    shadowRadius: 22,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 8,
                }}
            >
                <LinearGradient
                    colors={["#ECD3A0", "#D2B271"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        width: "100%",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                    }}
                >
                    <Text numberOfLines={1} className="font-display-bold text-[17px] text-ink">
                        Choose your focus
                    </Text>
                    <ArrowRight size={18} color="#0A0F1A" strokeWidth={2.5} />
                </LinearGradient>
            </Pressable>
        </View>
    );
}
