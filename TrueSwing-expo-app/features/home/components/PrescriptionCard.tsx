import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";

// MVP PLACEHOLDER: static prescribed issue. Real data (most recent analysis's
// primary issue, user-switchable) is wired in a later step.
const PRESCRIBED_ISSUE = "Early extension";

type PrescriptionCardProps = {
    onStart?: () => void;
};

export default function PrescriptionCard({ onStart }: PrescriptionCardProps) {
    return (
        <View>
            <Text className="font-sans-medium text-xs uppercase tracking-[2px] text-sand-dim">
                Today&apos;s drill
            </Text>

            <Text className="mt-2 font-display-bold text-[32px] leading-tight text-sand">
                {PRESCRIBED_ISSUE}
            </Text>

            <Text className="mt-2 font-sans text-[15px] leading-snug text-sand-dim">
                Still chasing that early extension — let&apos;s fix it today.
            </Text>

            <Pressable
                onPress={onStart}
                className="mt-4 overflow-hidden rounded-2xl"
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
                        Start today&apos;s drill
                    </Text>
                    <ArrowRight size={18} color="#0A0F1A" strokeWidth={2.5} />
                </LinearGradient>
            </Pressable>
        </View>
    );
}
