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
import React, { useCallback, useRef, useState } from "react";
import { AiConsentModal } from "features/privacy/components/AIconsentModel";
import { hasValidAiConsent, saveAiConsent, resetAiConsentForDebug } from "features/privacy/utils/consentHelper";

export default function UploadFlow() {
    const { currentScreen, next, prev, goToSelectVideo } = useUploadFlowSequence();
    const { videoUri, setVideoUri, removeVideo, trimmedVideoUri, trimVideo, endTime, startTime } = useVideo();
    const promptActions = usePrompt();
    const upload = useUpload();

    const didInitRef = useRef(false);
    const [isConsentModalVisible, setIsConsentModalVisible] = useState(false);

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
            {currentScreen === 'SelectVideo' && <SelectVideoScreen onNext={next} onBack={() => {}} setVideoUri={setVideoUri} videoUri={videoUri} isActive={currentScreen === 'SelectVideo'} />}
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