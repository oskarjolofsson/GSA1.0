import { Pressable, Text, ActivityIndicator, View } from "react-native";

import { tapHaptic } from "../utils/haptics";

type Props = {
    label: string;
    onPress: () => void;
    /** Dimmed and inert. The focus step uses it before anything is picked. */
    disabled?: boolean;
    busy?: boolean;
    /** Quiet variant for the escape hatches — "I already have an account", "Skip". */
    tone?: "primary" | "quiet";
};

/** The intro's only button. Sized to the 44pt touch minimum at every tone. */
export default function IntroButton({
    label,
    onPress,
    disabled = false,
    busy = false,
    tone = "primary",
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
            ) : null}
            <Text className="font-sans-semibold text-[16px] text-ink">{label}</Text>
        </Pressable>
    );
}
