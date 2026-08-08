import { ScreenProps } from 'features/shared/types';
import { memo, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CameraType,
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from 'expo-camera';
import { LibraryBig, ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import FramingGuide from '../components/FramingGuide';

const RecordingTimer = memo(function RecordingTimer({
  isRecording,
  insets,
}: {
  isRecording: boolean;
  insets: any;
}) {
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
      className="pointer-events-none absolute top-0 z-10 w-full items-center"
      style={{
        paddingTop: insets.top > 0 ? insets.top + 16 : 40,
        opacity: isRecording ? 1 : 0,
      }}>
      {/* Gold dot, not a red chip. Red belongs to `danger` and means failed;
                using it for "recording" is the one place a hue lies about state. */}
      <View className="flex-row items-center rounded-full bg-ink/80 px-4 py-1.5">
        <View className="mr-2.5 h-2 w-2 rounded-full bg-gold" />
        <Text className="w-[64px] text-center font-sans-medium text-[15px] tabular-nums tracking-widest text-sand">
          {formattedTime}
        </Text>
      </View>
    </View>
  );
});

export default function SelectVideoScreen({
  onBack,
  onNext,
  setVideoUri,
  videoUri,
  isActive,
}: ScreenProps & {
  setVideoUri: (uri: string | null) => void;
  videoUri: string | null;
  isActive: boolean;
}) {
  const cameraRef = useRef<CameraView | null>(null);
  const insets = useSafeAreaInsets();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [hasMediaLibraryPermission, requestMediaLibraryPermission] =
    ImagePicker.useMediaLibraryPermissions();

  // Rear camera only. A swing filmed on the front camera is unusable for
  // analysis, and the flip control was already commented out before this.
  const facing: CameraType = 'back';
  const [isRecording, setIsRecording] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);

  // Advance only on a video this screen just produced. Keying off `videoUri`
  // alone re-fired whenever the screen remounted with a uri still in state, so
  // pressing Back on the trim screen bounced the golfer straight forward again
  // and the back button looked broken.
  const handleCaptured = (uri: string) => {
    setVideoUri(uri);
    onNext();
  };

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
          Alert.alert('Media permission needed', 'Allow Photos access to select a video.');
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
        Alert.alert('Could not read video', 'Please select another video or try again.');
        return;
      }

      handleCaptured(selectedUri);
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert(
        'Could not open selected video',
        'This can happen with cloud-only videos or limited Photos access. Please download the video locally in Photos and try again.'
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
        handleCaptured(video.uri);
      }
    } catch (error) {
      console.error('recordAsync error:', error);
      setIsCameraReady(false);
      setIsRecording(false);
      setIsBusy(false);
      setCameraKey((k) => k + 1);
      Alert.alert('Recording failed', 'Camera session reset. Try again.');
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
      console.error('stopRecording error:', error);
    }
  };

  if (!cameraPermission || !microphonePermission) {
    return (
      <View className="flex-1 items-center justify-center bg-ink">
        <ActivityIndicator color="#8A8676" />
      </View>
    );
  }

  if (!hasPermissions) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-ink px-6">
        <Text className="text-center font-display text-[28px] leading-[34px] text-sand">
          Camera access needed
        </Text>
        <Text className="mb-8 mt-3 text-center text-[13px] leading-[19px] text-sand-dim">
          TrueSwing needs the camera and microphone to film your swing, and Photos to use a video
          you already have.
        </Text>

        <Pressable
          accessibilityRole="button"
          className="min-h-[44px] justify-center rounded-full border border-gold px-7 active:opacity-70"
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
                'Permissions blocked',
                'Please enable Camera, Microphone, and Photos access in your device settings.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Open Settings',
                    onPress: () => Linking.openSettings(),
                  },
                ]
              );
            }
          }}>
          <Text className="font-sans-medium text-[15px] text-gold">Grant access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <CameraView
        active={isActive}
        key={cameraKey}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="video"
        mute={false}
        onCameraReady={() => {
          console.log('camera ready');
          setIsCameraReady(true);
        }}
        onMountError={(e) => {
          console.error('camera mount error', e);
        }}
      />

      <FramingGuide hidden={isRecording} />

      {/* Back to the Add-a-focus chooser. Hidden while recording. */}
      <View
        className="absolute left-4 z-10"
        style={{ top: insets.top > 0 ? insets.top + 12 : 36, opacity: isRecording ? 0 : 1 }}
        pointerEvents={isRecording ? 'none' : 'auto'}>
        <Pressable
          onPress={onBack}
          disabled={isRecording}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-11 w-11 items-center justify-center rounded-full bg-ink/50 active:opacity-70">
          <ChevronLeft size={24} color="#EADFC8" />
        </Pressable>
      </View>

      <View
        className="absolute bottom-0 left-0 right-0 w-full"
        style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 24 }}>
        <View className="min-h-[100px] flex-row items-center justify-center px-6 pb-5 pt-2">
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

          {/* Cream ring, cream disc; the disc becomes a gold square while
                        recording. Shape carries the state as well as colour does, so
                        it still reads for a colourblind golfer in sunlight. */}
          <Pressable
            onPress={isRecording ? stopRecording : startRecording}
            disabled={!isCameraReady || (isBusy && !isRecording)}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
            accessibilityState={{ disabled: !isCameraReady || (isBusy && !isRecording) }}
            className={`h-[84px] w-[84px] items-center justify-center rounded-full border-[5px] ${
              isRecording ? 'border-gold' : 'border-sand'
            } ${!isCameraReady ? 'opacity-50' : ''}`}>
            <View
              className={`${
                isRecording
                  ? 'h-[30px] w-[30px] rounded-md bg-gold'
                  : 'h-[58px] w-[58px] rounded-full bg-sand'
              }`}
            />
          </Pressable>

          <View
            className="absolute right-6"
            style={{ opacity: isRecording ? 0 : 1 }}
            pointerEvents={isRecording ? 'none' : 'auto'}>
            <Pressable
              onPress={() => {
                pickImageAsync();
              }}
              disabled={isRecording}
              accessibilityRole="button"
              accessibilityLabel="Choose a video from your library"
              className="min-h-[44px] min-w-[72px] items-center justify-center px-2 py-2 active:opacity-70">
              <LibraryBig size={20} color="#EADFC8" />
              <Text className="mt-1.5 text-[13px] text-sand">Library</Text>
            </Pressable>
          </View>
        </View>

        <Text
          className="px-6 text-center text-[13px] text-sand-dim"
          style={{
            textShadowColor: 'rgba(0, 0, 0, 0.9)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }}>
          {isRecording ? 'Tap again to stop' : 'Up to 30 seconds'}
        </Text>
      </View>

      <RecordingTimer isRecording={isRecording} insets={insets} />
    </View>
  );
}
