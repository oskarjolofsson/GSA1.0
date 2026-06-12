import { useCallback } from "react";
import { useScreenSequence } from "features/shared/hooks/useScreenState";

type SignInScreen = "landing" | "emailSignIn";
const screens: SignInScreen[] = ["landing", "emailSignIn"];

export function useSignInFlowSequence() {
    const { currentScreen, goTo } = useScreenSequence<SignInScreen>({ screens });

    const goToLanding = useCallback(() => goTo("landing"), [goTo]);
    const goToEmailSignIn = useCallback(() => goTo("emailSignIn"), [goTo]);

    return {
        currentScreen,
        goToLanding,
        goToEmailSignIn,
    };
}
