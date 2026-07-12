import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, ChevronRight } from "lucide-react-native";

type Variant = "hero" | "secondary";

type FocusPanelProps = {
    variant: Variant;
    icon: React.ReactNode; // un-boxed lucide icon (ink on hero, gold on cards)
    title: string;
    subtitle: string;
    onPress: () => void;
};

const INK = "#0A0F1A";
const SAND_DIM = "#8A8676";

// A card in the Add-a-focus chooser. Two skins over one layout:
//   hero      → gold gradient + glow, dark ink type, arrow (the primary path)
//   secondary → quiet ink-raised card, sand type, chevron
//
//   ┌───────────────────────────────┐
//   │ [icon]  Title (Fraunces)   →/› │  ← icon + flex-1 title + trailing affordance
//   │  subtitle (Hanken, dim)        │
//   └───────────────────────────────┘
export default function FocusPanel({ variant, icon, title, subtitle, onPress }: FocusPanelProps) {
    const isHero = variant === "hero";

    const Row = (
        <>
            <View className="flex-row items-center">
                {icon}
                <Text
                    className={
                        isHero
                            ? "ml-3 flex-1 font-display-bold text-[30px] leading-tight text-ink"
                            : "ml-3 flex-1 font-display-bold text-[22px] leading-tight text-sand"
                    }
                >
                    {title}
                </Text>
                {isHero ? (
                    <ArrowRight size={24} color={INK} strokeWidth={2.5} />
                ) : (
                    <ChevronRight size={22} color={SAND_DIM} strokeWidth={2.25} />
                )}
            </View>
            <Text
                className={
                    isHero
                        ? "mt-2 font-sans text-[15px] leading-6 text-ink/70"
                        : "mt-1 font-sans text-[14px] leading-5 text-sand-dim"
                }
            >
                {subtitle}
            </Text>
        </>
    );

    if (isHero) {
        return (
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={title}
                className="flex-[1.5] overflow-hidden rounded-3xl"
                style={({ pressed }) => ({
                    opacity: pressed ? 0.94 : 1,
                    shadowColor: "#E4C892",
                    shadowOpacity: 0.35,
                    shadowRadius: 22,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 8,
                })}
            >
                <LinearGradient
                    colors={["#ECD3A0", "#796641"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}
                >
                    {Row}
                </LinearGradient>
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={title}
            className="flex-1 justify-center overflow-hidden rounded-3xl border border-white/10 px-6"
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
        >
            {Row}
        </Pressable>
    );
}
