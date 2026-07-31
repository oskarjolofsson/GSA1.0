import { useUploadFlowSequence } from "./hooks/useUploadFlowSequence";
import { Alert, View } from "react-native";
import SelectVideoScreen from "./screens/SelectVideoScreen";
import TrimVideoScreen from "./screens/TrimVideoScreen";
import PromptsScreen from "./screens/PromptsScreen";
import UploadProgressScreen from "./screens/UploadProgressScreen";
import { useVideo } from "./hooks/useVideo";
import { usePrompt } from "./hooks/usePrompt";
import { useUpload } from "./hooks/useUpload";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AiConsentModal } from "features/privacy/components/AIconsentModel";
import { hasValidAiConsent, saveAiConsent, resetAiConsentForDebug } from "features/privacy/utils/consentHelper";
import { consumeRetestIntent } from "features/programs/retestIntent";
import { logRetestUpload } from "features/programs/services/retest";

export default function UploadFlow({ onCancel }: { onCancel: () => void }) {
    const { currentScreen, next, prev, goToSelectVideo } = useUploadFlowSequence();
    const { videoUri, setVideoUri, removeVideo, trimmedVideoUri, trimVideo, endTime, startTime } = useVideo();
    const promptActions = usePrompt();
    const upload = useUpload();

    const didInitRef = useRef(false);
    const [isConsentModalVisible, setIsConsentModalVisible] = useState(false);

    // When an upload actually completes, credit a pending re-test (if the user
    // launched this from a retest step). Fires once per uploaded analysis; a no-op
    // for normal uploads (no intent pending).
    const lastCreditedRef = useRef<string | null>(null);
    useEffect(() => {
        if (!upload.loading && upload.analysisId && !upload.error && lastCreditedRef.current !== upload.analysisId) {
            lastCreditedRef.current = upload.analysisId;
            const intent = consumeRetestIntent();
            if (intent) {
                logRetestUpload(intent).catch((e) => console.error("Failed to credit re-test:", e));
            }
        }
    }, [upload.loading, upload.analysisId, upload.error]);

    const resetFlow = useCallback(() => {
        removeVideo();
        promptActions.setStartTime(0);
        promptActions.setEndTime(0);
        goToSelectVideo();
    }, [removeVideo, promptActions, goToSelectVideo]);

    // Run once when entering this flow for the first time, not on every refocus.
    useFocusEffect(
        useCallback(() => {
            if (!didInitRef.current) {
                didInitRef.current = true;
                resetFlow();
            }
        }, [resetFlow])
    )

    const handleStartUpload = async () => {
        // Check consent before starting upload
        const consent = await hasValidAiConsent()
        if (!consent) {
            setIsConsentModalVisible(true);
            return;
        }

        // set start and end-time to correct values before starting upload
        promptActions.setStartTime(startTime);
        promptActions.setEndTime(endTime);

        if (trimmedVideoUri && promptActions.prompt) {
            upload.startUpload(trimmedVideoUri, promptActions.prompt, startTime, endTime);
            next();
        }
    };

    const handleAcceptConsent = async () => {
        await saveAiConsent();
        setIsConsentModalVisible(false);
        handleStartUpload();
    };

    const handleCancelConsent = () => {
        setIsConsentModalVisible(false);
    }

    return (
        <View style={{ flex: 1 }}>
            {currentScreen === 'SelectVideo' && <SelectVideoScreen onNext={next} onBack={onCancel} setVideoUri={setVideoUri} videoUri={videoUri} isActive={currentScreen === 'SelectVideo'} />}
            {currentScreen === 'TrimVideo' && <TrimVideoScreen onNext={next} onBack={prev} videoUri={videoUri}  removeVideo={removeVideo} setVideoUri={setVideoUri} trimVideo={trimVideo} />}
            {currentScreen === 'Prompts' && <PromptsScreen onNext={() => void handleStartUpload()} onBack={prev} prompt={promptActions} onDeleteCache={resetAiConsentForDebug}/>}
            {currentScreen === 'UploadProgress' && <UploadProgressScreen onBack={() => {resetFlow(); goToSelectVideo()}} onNext={() => {}} upload={upload} />}
            
            <AiConsentModal
                visible={isConsentModalVisible}
                onAccept={handleAcceptConsent}
                onCancel={handleCancelConsent}
            />
        </View>
    );
}