import React, { useRef } from "react";
import { Dimensions, Pressable, StatusBar, Text, View } from "react-native";
import VideoScrubber from "features/scrubber/screens/VideoScrubber";
import type { ScrubberRef } from "features/scrubber/types";
import { ScreenProps } from "features/shared/types";

const { width, height } = Dimensions.get("window");

type TrimScreenProps = ScreenProps & {
  videoUri: string | null;
  setVideoUri: (uri: string | null) => void;
  removeVideo: () => void;
  trimVideo: (startMs: number, endMs: number) => Promise<void>;
};

export default function TrimScreen({
  onBack,
  onNext,
  videoUri,
  setVideoUri,
  trimVideo,
}: TrimScreenProps) {
  const scrubberRef = useRef<ScrubberRef>(null);

  const handleNext = () => {
    const range = scrubberRef.current?.getRange();
    if (range) {
      trimVideo(range.startMs, range.endMs);
    }
    onNext();
  };

  return (
    <View style={{ width, height }} className="bg-black">
      <StatusBar barStyle="light-content" />
      <VideoScrubber
        ref={scrubberRef}
        videoUri={videoUri}
        mode="trim"
        controls={
          // No SafeAreaView here — VideoScrubber wraps controls+bar in one with edges=["bottom"]
          // so the safe-area inset lands below the bar, not between the buttons and the bar.
          <View className="flex-row justify-between px-5 pt-3 pb-2">
            <Pressable
              onPress={() => {
                setVideoUri(null);
                onBack();
              }}
            >
              <Text className="text-white font-medium text-lg">Back</Text>
            </Pressable>
            <Pressable onPress={handleNext}>
              <Text className="text-white font-bold text-lg">Next</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}
