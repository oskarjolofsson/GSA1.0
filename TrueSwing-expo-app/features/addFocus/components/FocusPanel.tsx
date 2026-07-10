import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";

type GlowCorner = "top-right" | "bottom-left";

type FocusPanelProps = {
    index: string;          // "01" | "02" | "03"
    icon: React.ReactNode;  // small gold lucide icon
    title: string;
    subtitle: string;
    onPress: () => void;
    glowCorner?: GlowCorner;
    eyebrow?: string;       // tiny tracked label, only panel 1 uses it
};

// One full-height door in the Add-a-focus chooser. Premium via the app's design
// system: deep-navy field, Fraunces title, sand/gold ink, a faint gold corner glow,
// and a big Fraunces index numeral as a watermark. No images.
//
//   ┌───────────────────────────────┐
//   │ (eyebrow)                  01  │  ← numeral watermark, sand @ ~8%
//   │  ◇ Title (Fraunces 28)      →  │  ← gold icon + title ........ gold arrow
//   │    subtitle (Hanken, dim)      │
//   └───────────────────────────────┘  gold glow bleeds from one corner
export default function FocusPanel({
    index,
    icon,
    title,
    subtitle,
    onPress,
    glowCorner = "top-right",
    eyebrow,
}: FocusPanelProps) {
    const glowPosition =
        glowCorner === "top-right"
            ? { top: -60, right: -60 }
            : { bottom: -60, left: -60 };

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={title}
            className="flex-1"
            style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
        >
            {({ pressed }) => (
                <View className="flex-1 justify-center overflow-hidden bg-ink px-7">
                    {/* Gold corner glow — decorative, never intercepts touches. */}
                    {/* <LinearGradient
                        pointerEvents="none"
                        colors={["rgba(228,200,146,0.12)", "transparent"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ position: "absolute", width: 260, height: 260, borderRadius: 130, ...glowPosition }}
                    /> */}

                    {/* Index numeral watermark. */}
                    {/* <Text
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                        className="absolute right-6 top-6 font-display-black text-[64px] leading-none text-sand"
                        style={{ opacity: 0.08 }}
                    >
                        {index}
                    </Text> */}

                    {/* Pressed wash. */}
                    {pressed ? (
                        <View pointerEvents="none" className="absolute inset-0 bg-gold/5" />
                    ) : null}

                    {eyebrow ? (
                        <Text className="mb-3 font-sans-medium text-[11px] uppercase tracking-[2px] text-sand-dim">
                            {eyebrow}
                        </Text>
                    ) : null}

                    <View className="flex-row items-center">
                        {icon}
                        <Text className="ml-3 flex-1 font-display-bold text-[28px] leading-tight text-sand">
                            {title}
                        </Text>
                        <ArrowRight size={22} color="#E4C892" strokeWidth={2.25} />
                    </View>

                    <Text className="mt-2 font-sans text-[15px] leading-6 text-sand-dim">
                        {subtitle}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}
