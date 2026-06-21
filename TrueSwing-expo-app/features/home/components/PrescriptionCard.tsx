import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react-native";
import type { Issue } from "features/issues/types";

type PrescriptionCardProps = {
    issue: Issue | null;
    index: number; // position of `issue` in the user's list
    total: number; // number of issues (for the switcher indicator)
    loading: boolean;
    onPrev: () => void;
    onNext: () => void;
    onStart: () => void;
};

export default function PrescriptionCard({
    issue,
    index,
    total,
    loading,
    onPrev,
    onNext,
    onStart,
}: PrescriptionCardProps) {
    const canSwitch = total > 1;
    // Can't start a session without an analysis_issue_id (mirrors the reel guard).
    const canStart = !!issue?.analysis_issue_id && !loading;

    return (
        <View>
            <View className="flex-row items-center justify-between">
                <Text className="font-sans-medium text-xs uppercase tracking-[2px] text-sand-dim">
                    Today&apos;s issue
                </Text>

                {canSwitch && (
                    <View className="flex-row items-center gap-1">
                        <Pressable onPress={onPrev} hitSlop={8} className="p-1 active:opacity-60">
                            <ChevronLeft size={18} color="#8A8676" />
                        </Pressable>
                        <Text className="font-sans-medium text-xs text-sand-dim">
                            {index + 1}/{total}
                        </Text>
                        <Pressable onPress={onNext} hitSlop={8} className="p-1 active:opacity-60">
                            <ChevronRight size={18} color="#8A8676" />
                        </Pressable>
                    </View>
                )}
            </View>

            <Text className="mt-2 font-display-bold text-[32px] leading-tight text-sand">
                {loading ? "…" : issue?.title ?? "No issue yet"}
            </Text>

            <Text className="mt-2 font-sans text-[15px] leading-snug text-sand-dim">
                {issue
                    ? "Run today's drill to keep working it."
                    : "Make a swing analysis to get today's drill."}
            </Text>

            <Pressable
                onPress={onStart}
                disabled={!canStart}
                className="mt-4 overflow-hidden rounded-2xl"
                style={{
                    opacity: canStart ? 1 : 0.5,
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
                        Start today&apos;s drill
                    </Text>
                    <ArrowRight size={18} color="#0A0F1A" strokeWidth={2.5} />
                </LinearGradient>
            </Pressable>
        </View>
    );
}
