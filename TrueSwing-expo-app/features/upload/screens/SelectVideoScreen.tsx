import { ScreenProps } from "features/shared/types";
import { memo, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
    CameraType,
    CameraView,
    useCameraPermissions,
    useMicrophonePermissions,
} from "expo-camera";
import { RefreshCw, LibraryBig, ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';

const RecordingTimer = memo(function RecordingTimer({ isRecording, insets }: { isRecording: boolean, insets: any }) {
    const [recordingTime, setRecordingTime] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formattedTime = new Date(recordingTime * 1000).toISOString().substring(14, 19);

    return (
        <View
            className="absolute top-0 w-full items-center z-10 pointer-events-none"
            style={{
                paddingTop: insets.top > 0 ? insets.top + 16 : 40,
                opacity: isRecording ? 1 : 0
            }}
        >
            <View className="flex-row items-center rounded-full bg-red-600/90 px-4 py-1.5">
                <View className="mr-2 h-2.5 w-2.5 rounded-full bg-white" />
                <Text className="w-[64px] text-center font-mono text-base font-bold text-white tracking-widest tabular-nums">
                    {formattedTime}
                </Text>
            </View>
        </View>
    );
});

export default function SelectVideoScreen({ onBack, onNext, setVideoUri, videoUri, isActive }: ScreenProps & { setVideoUri: (uri: string | null) => void, videoUri: string | null, isActive: boolean }) {
    const cameraRef = useRef<CameraView | null>(null);
    const insets = useSafeAreaInsets();

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
    const [hasMediaLibraryPermission, requestMediaLibraryPermission] = ImagePicker.useMediaLibraryPermissions();

    const [facing, setFacing] = useState<CameraType>("back");
    const [isRecording, setIsRecording] = useState(false);
    const [isBusy, setIsBusy] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameraKey, setCameraKey] = useState(0);

    useEffect(() => {
        if (videoUri) {
            onNext();
        }
    }, [videoUri]);

    useEffect(() => {
        if (!cameraPermission?.granted) {
            requestCameraPermission();
        }
        if (!microphonePermission?.granted) {
            requestMicrophonePermission();
        }
        if (!hasMediaLibraryPermission?.granted) {
            requestMediaLibraryPermission();
        }
    }, [
        cameraPermission?.granted,
        microphonePermission?.granted,
        hasMediaLibraryPermission?.granted,
        requestCameraPermission,
        requestMicrophonePermission,
        requestMediaLibraryPermission,
    ]);

    const hasPermissions =
        cameraPermission?.granted &&
        microphonePermission?.granted &&
        hasMediaLibraryPermission?.granted;

    const pickImageAsync = async () => {
        try {
            let mediaPermission = hasMediaLibraryPermission;

            if (!mediaPermission?.granted) {
                const requested = await requestMediaLibraryPermission();
                mediaPermission = requested;

                if (!requested.granted) {
                    Alert.alert(
                        "Media permission needed",
                        "Allow Photos access to select a video."
                    );
                    return;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                allowsEditing: false,
                quality: 1,
            });

            if (result.canceled) {
                return;
            }

            const selectedUri = result.assets?.[0]?.uri;
            if (!selectedUri) {
                Alert.alert(
                    "Could not read video",
                    "Please select another video or try again."
                );
                return;
            }

            setVideoUri(selectedUri);
        } catch (error) {
            console.error("Video picker error:", error);
            Alert.alert(
                "Could not open selected video",
                "This can happen with cloud-only videos or limited Photos access. Please download the video locally in Photos and try again."
            );
        }
    };

    const startRecording = async () => {
        if (!cameraRef.current || isRecording || isBusy || !isCameraReady) return;

        try {
            setIsBusy(true);
            setIsRecording(true);

            const video = await cameraRef.current.recordAsync({
                maxDuration: 30,
            });

            if (video?.uri) {
                setVideoUri(video.uri);
            }
        } catch (error) {
            console.error("recordAsync error:", error);
            setIsCameraReady(false);
            setIsRecording(false);
            setIsBusy(false);
            setCameraKey((k) => k + 1);
            Alert.alert("Recording failed", "Camera session reset. Try again.");
            return;
        } finally {
            setIsRecording(false);
            setIsBusy(false);
        }
    };

    const stopRecording = async () => {
        if (!cameraRef.current || !isRecording) return;

        try {
            cameraRef.current.stopRecording();
        } catch (error) {
            console.error("stopRecording error:", error);
        }
    };

    const flipCamera = () => {
        if (isRecording) return;
        setIsCameraReady(false);
        setFacing((current) => (current === "back" ? "front" : "back"));
    };

    if (!cameraPermission || !microphonePermission) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <ActivityIndicator />
            </View>
        );
    }

    if (!hasPermissions) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-zinc-950 px-6">
                <Text className="mb-3 text-2xl font-bold text-white">Permissions needed</Text>
                <Text className="mb-5 text-center text-base text-zinc-300">
                    Camera and microphone access are required to record video.
                </Text>

                <Pressable
                    className="rounded-xl bg-white px-5 py-3"
                    onPress={async () => {
                        const cameraResult = await requestCameraPermission();
                        const microphoneResult = await requestMicrophonePermission();
                        const mediaResult = await requestMediaLibraryPermission();

                        const deniedPermanently =
                            cameraResult.canAskAgain === false ||
                            microphoneResult.canAskAgain === false ||
                            mediaResult.canAskAgain === false;

                        if (deniedPermanently) {
                            Alert.alert(
                                "Permissions blocked",
                                "Please enable Camera, Microphone, and Photos access in your device settings.",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                        text: "Open Settisngs",
                                        onPress: () => Linking.openSettings(),
                                    },
                                ]
                            );
                        }
                    }}
                >
                    <Text className="font-bold text-zinc-950">Grant permissions</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <CameraView
                active={isActive}
                key={cameraKey}
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing={facing}
                mode="video"
                mute={false}
                onCameraReady={() => {
                    console.log("camera ready");
                    setIsCameraReady(true);
                }}
                onMountError={(e) => {
                    console.error("camera mount error", e);
                }}
            />

            {/* Back to the Add-a-focus chooser. Hidden while recording. */}
            <View
                className="absolute left-4 z-10"
                style={{ top: insets.top > 0 ? insets.top + 12 : 36, opacity: isRecording ? 0 : 1 }}
                pointerEvents={isRecording ? "none" : "auto"}
            >
                <Pressable
                    onPress={onBack}
                    disabled={isRecording}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                    className="h-11 w-11 items-center justify-center rounded-full bg-black/40 active:bg-white/20"
                >
                    <ChevronLeft size={24} color="white" />
                </Pressable>
            </View>

            <View
                className="absolute bottom-0 left-0 right-0 w-full"
                style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }}
            >
                <View className="flex-row items-center justify-center px-6 pt-2 pb-5 min-h-[100px]">

                    {/* <View
                        className="absolute left-6"
                        style={{ opacity: isRecording ? 0 : 1 }}
                        pointerEvents={isRecording ? "none" : "auto"}
                    >
                        <Pressable
                            onPress={flipCamera}
                            disabled={isRecording}
                            className="min-w-[72px] items-center rounded-2xl bg-black/40 px-4 py-3 active:bg-white/60 active:border active:border-white/60"
                        >
                            <RefreshCw size={20} color="white" />
                            <Text className="text-xs text-white">Flip</Text>
                        </Pressable>
                    </View> */}

                    <Pressable
                        onPress={isRecording ? stopRecording : startRecording}
                        disabled={!isCameraReady || (isBusy && !isRecording)}
                        className={`h-[84px] w-[84px] items-center justify-center rounded-full shadow-md border-[6px] ${isRecording ? "border-red-500" : "border-white"
                            }`}
                    >
                        <View
                            className={`bg-red-500 ${isRecording ? "h-[30px] w-[30px] rounded-lg" : "h-[56px] w-[56px] rounded-full"
                                }`}
                        />
                    </Pressable>

                    <View
                        className="absolute right-6"
                        style={{ opacity: isRecording ? 0 : 1 }}
                        pointerEvents={isRecording ? "none" : "auto"}
                    >
                        <Pressable
                            onPress={() => {
                                pickImageAsync();
                            }}
                            disabled={isRecording}
                            className="min-w-[72px] items-center rounded-2xl bg-black/40 px-4 py-3 active:bg-white/60 active:border active:border-white/60"
                        >
                            <LibraryBig size={20} color="white" />
                            <Text className="text-xs text-white">Gallery</Text>
                        </Pressable>
                    </View>
                </View>

                <Text
                    className="px-6 text-center text-sm font-medium text-white"
                    style={{ textShadowColor: "rgba(0, 0, 0, 0.8)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
                >
                    {isRecording
                        ? "Recording… tap the red button to stop"
                        : "Tap the red button to start recording"}
                </Text>
            </View>

            <RecordingTimer isRecording={isRecording} insets={insets} />
        </View>
    );
}