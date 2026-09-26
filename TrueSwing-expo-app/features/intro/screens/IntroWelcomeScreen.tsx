import { View, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "features/shared/components/Button";
import colors from "lib/colors";

type Props = {
    onStart: () => void;
    /** Straight to sign-in, for a returning golfer on a new phone. */
    onSignIn: () => void;
};

export default function IntroWelcomeScreen({ onStart, onSignIn }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-ink">
            <Image
                source={require("../../../assets/hero/welcome-golf.webp")}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                resizeMode="contain"
            />
            <LinearGradient
                colors={["transparent", "rgba(10,15,26,0.35)", "rgba(10,15,26,0.92)", colors.ink]}
                locations={[0, 0.45, 0.78, 1]}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />

            <View
                className="flex-1 px-6"
                style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
            >
                <View className="flex-1 items-center justify-center">
                    <Image
                        source={require("../../../assets/true_swing_logo2.png")}
                        style={{ width: 300, height: 300 }}
                        resizeMode="contain"
                    />
                </View>

                <View>
                    <Text className="font-display text-[38px] leading-[43px] text-sand">
                        Your best golf{"\n"}is ahead of you
                    </Text>
                    <Text className="mt-3 text-[15px] leading-[22px] text-sand-dim">
                        Stop guessing what to practice.
                    </Text>
                </View>

                <View className="mt-8">
                    <Button label="Choose your first focus" onPress={onStart} icon />
                    <View className="mt-4">
                        <Button label="I already have an account" onPress={onSignIn} tone="quiet" />
                    </View>
                </View>
            </View>
        </View>
    );
}
