import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import UploadFlow from "features/upload/uploadFlow";
import CoachFeedbackFlow from "features/coachFeedback/CoachFeedbackFlow";
import BrowseScreen from "features/browse/BrowseScreen";
import AddFocusChooser, { type AddFocusChoice } from "./AddFocusChooser";

type Mode = "chooser" | AddFocusChoice;

/**
 * The Upload tab's root. Shows the 3-way chooser, then mounts the chosen source
 * flow. Upload keeps its existing behavior untouched; coach and browse are new.
 * Resets to the chooser whenever the tab regains focus.
 */
export default function AddFocusFlow() {
    const [mode, setMode] = useState<Mode>("chooser");
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            setMode("chooser");
        }, [])
    );

    const backToChooser = useCallback(() => setMode("chooser"), []);

    // After a custom focus is created, go home — it's now the active focus.
    const goHome = useCallback(() => {
        setMode("chooser");
        router.replace("/(app)/(tabs)");
    }, [router]);

    return (
        <View style={{ flex: 1 }}>
            {mode === "chooser" && <AddFocusChooser onChoose={setMode} />}
            {mode === "upload" && <UploadFlow />}
            {mode === "coach" && <CoachFeedbackFlow onCancel={backToChooser} onDone={goHome} />}
            {mode === "browse" && <BrowseScreen onCancel={backToChooser} onDone={goHome} />}
        </View>
    );
}
