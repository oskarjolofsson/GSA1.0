import React from "react";
import { View, Text, Pressable } from "react-native";
import { Target, ChevronRight } from "lucide-react-native";

// MVP PLACEHOLDER: static prescribed issue. Real data (most recent analysis's
// primary issue, user-switchable) is wired in a later step.
const PRESCRIBED_ISSUE = "Early extension";

type PrescriptionCardProps = {
    onStart?: () => void;
};

export default function PrescriptionCard({ onStart }: PrescriptionCardProps) {
    return (
        <View className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <View className="mb-1 flex-row items-center gap-2">
                <Target size={16} color="#34d399" />
                <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                    Today
                </Text>
            </View>

            <Text className="text-2xl font-bold text-white">{PRESCRIBED_ISSUE}</Text>
            <Text className="mt-1 text-sm text-white/60">
                Run today&apos;s drill to keep working your stuck issue.
            </Text>

            <Pressable
                onPress={onStart}
                className="mt-4 flex-row items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 py-3.5 active:bg-emerald-600"
            >
                <Text className="text-base font-semibold text-[#06231a]">
                    Start today&apos;s drill
                </Text>
                <ChevronRight size={18} color="#06231a" />
            </Pressable>
        </View>
    );
}
