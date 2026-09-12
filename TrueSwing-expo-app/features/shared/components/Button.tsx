import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { ArrowRight } from "lucide-react-native";

import { tapHaptic } from "../utils/haptics";

type Props = {
    label: string;
    onPress: () => void;
    /** Dimmed and inert. */
    disabled?: boolean;
    busy?: boolean;
    /** "primary": solid gold fill, full-width CTA (intro's welcome/focus steps).
     *  "quiet": text-only escape hatch ("Skip", "I already have an account").
     *  "outline": bordered gold, transparent background — a CTA sitting on a
     *  surface that already spends gold elsewhere (e.g. a sheet's drill rail),
     *  where a solid fill would compete for the same accent budget. */
    tone?: "primary" | "quiet" | "outline";
    /** Leading arrow on the primary tone only. */
    icon?: boolean;
    /** Label swapped in on the outline tone while busy (e.g. "Starting…").
     *  Ignored on other tones, which show a spinner instead. */
    busyLabel?: string;
};

/** The app's one button, at every tone. Sized to the 44pt touch minimum. */
export default function Button({
    label,
    onPress,
    disabled = false,
    busy = false,
    tone = "primary",
    icon = false,
    busyLabel,
}: Props) {
    const inert = disabled || busy;
    const handlePress = () => {
        tapHaptic();
        onPress();
    };

    if (tone === "quiet") {
        return (
            <Pressable
                onPress={handlePress}
                disabled={inert}
                accessibilityRole="button"
                className="min-h-[44px] items-center justify-center active:opacity-70"
            >
                <Text className="text-[14px] text-sand-dim">{label}</Text>
            </Pressable>
        );
    }

    if (tone === "outline") {
        return (
            <Pressable
                onPress={handlePress}
                disabled={inert}
                accessibilityRole="button"
                accessibilityState={{ disabled: inert }}
                className={`min-h-[52px] items-center justify-center rounded-2xl border ${
                    inert ? "border-white/[.13]" : "border-gold active:opacity-70"
                }`}
            >
                <Text
                    className={`text-[14px] uppercase tracking-[1.6px] ${
                        inert ? "text-sand-dim" : "text-gold"
                    }`}
                >
                    {busy ? (busyLabel ?? label) : label}
                </Text>
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={handlePress}
            disabled={inert}
            accessibilityRole="button"
            accessibilityState={{ disabled: inert }}
            className={`min-h-[54px] flex-row items-center justify-center rounded-2xl bg-gold px-6 active:opacity-80 ${
                inert ? "opacity-40" : ""
            }`}
        >
            {busy ? (
                <View className="mr-2">
                    <ActivityIndicator size="small" color="#0A0F1A" />
                </View>
            ) : icon ? (
                <View className="mr-2">
                    <ArrowRight size={18} color="#0A0F1A" strokeWidth={2.2} />
                </View>
            ) : null}
            <Text className="font-sans-semibold text-[16px] text-ink">{label}</Text>
        </Pressable>
    );
}
