import React, { useEffect } from "react";
import { View } from "react-native";

import { useScreenSequence } from "features/shared/hooks/useScreenState";
import LoadingState from "features/shared/components/LoadingState";
import { useCoachFeedback } from "./useCoachFeedback";
import FeedbackInputScreen from "./screens/FeedbackInputScreen";
import FeedbackReviewScreen from "./screens/FeedbackReviewScreen";

type Screen = "Input" | "Review";
const screens: Screen[] = ["Input", "Review"];

type Props = {
    onCancel: () => void; // back to the chooser
    onDone: () => void;    // custom focus created -> go home
};

/** Input notes -> AI-formatted editable draft -> confirm. Nothing persists until confirm. */
export default function CoachFeedbackFlow({ onCancel, onDone }: Props) {
    const { currentScreen, goTo } = useScreenSequence<Screen>({ screens });
    const cf = useCoachFeedback();

    // Advance to the review step as soon as a draft exists.
    useEffect(() => {
        if (cf.draft) goTo("Review");
    }, [cf.draft, goTo]);

    if (cf.submitting) {
        return <LoadingState title="Setting up your focus" subtitle="Creating your plan…" />;
    }

    return (
        <View style={{ flex: 1 }}>
            {currentScreen === "Input" && (
                <FeedbackInputScreen cf={cf} onBack={onCancel} />
            )}
            {currentScreen === "Review" && (
                <FeedbackReviewScreen cf={cf} onBack={() => goTo("Input")} onDone={onDone} />
            )}
        </View>
    );
}
