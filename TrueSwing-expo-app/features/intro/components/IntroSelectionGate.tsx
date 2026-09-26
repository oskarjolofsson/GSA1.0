import type { PropsWithChildren } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { useApplyIntroSelection } from "../hooks/useApplyIntroSelection";
import colors from "lib/colors";

/**
 * Starts the focus picked in the pre-signup intro, before the app renders.
 *
 * A gate rather than a hook inside home, because of ordering: home reads its
 * programs on focus, so a program created alongside it would not appear until
 * something re-triggered that fetch. Blocking here means home mounts with the
 * focus already in place — the golfer's first screen is their plan.
 *
 * Costs one AsyncStorage read on each authenticated mount, which resolves in
 * milliseconds and shows the same spinner the auth and health gates around it
 * already use. Only the rarer "applying" case is worth a word of explanation,
 * since it waits on a request.
 */
export default function IntroSelectionGate({ children }: PropsWithChildren) {
    const { state } = useApplyIntroSelection();

    if (state === "checking") {
        return (
            <View className="flex-1 items-center justify-center bg-ink">
                <ActivityIndicator color={colors.gold} />
            </View>
        );
    }

    if (state === "applying") {
        return (
            <View className="flex-1 items-center justify-center bg-ink px-8">
                <ActivityIndicator color={colors.gold} />
                <Text className="mt-5 font-display text-[20px] text-sand">
                    Building your practice plan
                </Text>
                <Text className="mt-2 text-center text-[14px] leading-[20px] text-sand-dim">
                    Setting up the focus you chose.
                </Text>
            </View>
        );
    }

    return <>{children}</>;
}
