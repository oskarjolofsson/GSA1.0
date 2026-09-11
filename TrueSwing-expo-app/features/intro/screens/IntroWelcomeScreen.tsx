import { View, Text, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IntroButton from "../components/IntroButton";

type Props = {
    onStart: () => void;
    /** Straight to sign-in, for a returning golfer on a new phone. */
    onSignIn: () => void;
};

/** The first thing anyone sees. One promise, one action.
 *
 *  No sign-up buttons here on purpose: asking for an account before showing what
 *  the app is for is the drop-off this screen exists to remove. The golfer picks
 *  something first, and the account comes after there is a reason to make one. */
export default function IntroWelcomeScreen({ onStart, onSignIn }: Props) {
    const insets = useSafeAreaInsets();

    return (
        <View
            className="flex-1 bg-ink px-6"
            style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        >
            <View className="flex-1 justify-center">
                <Image
                    source={require("../../../assets/true_swing_logo2.png")}
                    style={{ width: "70%", height: 120 }}
                    resizeMode="contain"
                />

                <Text className="mt-10 font-display text-[38px] leading-[43px] text-sand">
                    Welcome to{"\n"}TrueSwing
                </Text>
                <Text className="mt-5 text-[17px] leading-[25px] text-gold">
                    A practice plan you&apos;ll actually stick to.
                </Text>
                <Text className="mt-6 text-[15px] leading-[23px] text-sand-dim">
                    Pick the part of your game you want to fix and one focus to start with.
                    We&apos;ll build the drills around it.
                </Text>
            </View>

            <View>
                <IntroButton label="Choose your first focus" onPress={onStart} />
                <View className="mt-4">
                    <IntroButton label="I already have an account" onPress={onSignIn} tone="quiet" />
                </View>
            </View>
        </View>
    );
}
