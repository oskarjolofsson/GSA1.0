import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { AnalysisStatusResponse } from "../types";
import { ScreenProps } from "features/shared/types";
import { UploadProps } from "../hooks/useUpload";
import * as Progress from 'react-native-progress';
import LoadingState from "features/shared/components/LoadingState";
import ErrorState from "features/shared/components/ErrorState";
import AnalysisSuccess from "../components/greenCheck";
import { useRouter } from "expo-router";

type ProgressScreenProps = ScreenProps & {
    upload: UploadProps;
};

export default function ProgressScreen({ onBack, onNext, upload }: ProgressScreenProps) {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<AnalysisStatusResponse | null>(null);
    const router = useRouter(); 

    const success = status && !status.error_message;

    // Track 45-second timer
    useEffect(() => {
        if (!upload) return;

        if (upload.loading) {
            const interval = setInterval(() => {
                setProgress(p => {
                    if (p >= 1) {
                        clearInterval(interval);
                        return 1;
                    }
                    return p + (1 / 100);
                });
            }, 350); // 45s / 100 ticks = 450ms per tick

            return () => clearInterval(interval);
        }
    }, [upload?.loading]);

    // Check status when loading finishes or we hit 100%
    useEffect(() => {
        let isActive = true;

        const checkStatus = async () => {
            if (upload?.analysisId) {
                const result = await upload.checkAnalysisStatus(upload.analysisId);
                if (isActive) {
                    setStatus(result);
                    setProgress(1); // Jump to 100% since it's done
                }
            }
        };

        // If loading finishes early, OR we naturally hit 100%
        if ((upload && !upload.loading && upload.analysisId) || progress >= 1) {
            checkStatus();
        }

        return () => { isActive = false; };
    }, [upload.loading, progress]);

    if (!upload) {
        return <ErrorState message="Upload data is missing. Please restart the upload process." onRetry={onBack} />;
    }

    if (upload.error) {
        console.error('Upload Error:', upload.error);
        return <ErrorState message={`Upload failed due to backend error or faulty upload`} onRetry={onBack} />;
    }

    if (upload.loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="text-2xl font-bold mb-8 text-white">
                    {progress >= 1 || (!upload?.loading && upload?.analysisId) ? "Finalizing Analysis..." : "Analyzing Video..."}
                </Text>

                <Progress.Circle
                    size={150}
                    progress={progress}
                    showsText={true}
                    formatText={() => `${Math.round(progress * 100)}%`}
                    color="#ffffff"
                    unfilledColor="#333333"
                    thickness={8}
                    textStyle={{ fontWeight: 'bold' }}
                />

                <View className="mt-12 flex-row space-x-4">
                    <Text className="text-white bg-gray-600 px-6 py-3 rounded-lg overflow-hidden" onPress={onBack}>
                        Cancel
                    </Text>
                </View>
            </View>
        );
    }

    if (success) {
        return (
            <AnalysisSuccess onNext={() => router.push('/(tabs)')} onBack={onBack} />
        );
    }

    if (status && status.error_message) {
        return <ErrorState message={`Analysis failed: ${status.error_message}`} onRetry={onBack} />;
    }
 
    return <LoadingState title="Verifying..."/>;
}