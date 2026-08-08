import React, { useRef } from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import VideoScrubber from 'features/scrubber/screens/VideoScrubber';
import type { ScrubberRef } from 'features/scrubber/types';
import { ScreenProps } from 'features/shared/types';

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
    // Was a fixed Dimensions.get("window") box, which is wrong the moment the
    // window is not the screen (rotation, split view, a keyboard resize).
    <View className="flex-1 bg-ink">
      <StatusBar barStyle="light-content" />

      <SafeAreaView edges={['top']} className="px-6 pb-4 pt-2">
        <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
          Step 2 of 3
        </Text>
        <Text className="mt-3 font-display text-[28px] leading-[34px] text-sand">
          Trim to the swing
        </Text>
        <Text className="mt-2 text-[13px] leading-[19px] text-sand-dim">
          Keep the backswing through the follow-through.
        </Text>
      </SafeAreaView>

      <VideoScrubber
        ref={scrubberRef}
        videoUri={videoUri}
        mode="trim"
        controls={
          // No SafeAreaView here — VideoScrubber wraps controls+bar in one with edges=["bottom"]
          // so the safe-area inset lands below the bar, not between the buttons and the bar.
          <View className="flex-row items-center justify-between border-t border-sand/[.13] px-6 pb-2 pt-4">
            <Pressable
              onPress={() => {
                setVideoUri(null);
                onBack();
              }}
              accessibilityRole="button"
              className="min-h-[44px] justify-center pr-4 active:opacity-70">
              <Text className="text-[15px] text-sand-dim">Back</Text>
            </Pressable>

            <Pressable
              onPress={handleNext}
              accessibilityRole="button"
              className="min-h-[44px] justify-center rounded-full border border-gold px-7 active:opacity-70">
              <Text className="font-sans-medium text-[15px] text-gold">Next</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}
