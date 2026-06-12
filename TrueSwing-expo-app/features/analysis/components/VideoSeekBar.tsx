import { useState } from "react";
import { View } from "react-native";
import Slider from "@react-native-community/slider";

type VideoSeekBarProps = {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeekStart?: () => void;
  onSeekChange?: (time: number) => void;
  onSeekComplete: (time: number) => void;
  onPlayPause?: () => void;
};

export default function VideoSeekBar({
  currentTime,
  duration,
  isPlaying: _isPlaying,
  onSeekStart,
  onSeekChange,
  onSeekComplete,
  onPlayPause: _onPlayPause,
}: VideoSeekBarProps) {
  const safeDuration = Math.max(duration || 0, 0);
  const safeCurrent = Math.min(Math.max(currentTime || 0, 0), safeDuration);

  const [isSliding, setIsSliding] = useState(false);
  const [localValue, setLocalValue] = useState(safeCurrent);

  const displayedValue = isSliding ? localValue : safeCurrent;
  const progress = safeDuration > 0 ? displayedValue / safeDuration : 0;

  const progressPercent: `${number}%` = `${progress * 100}%`;

  return (
    <View className="rounded-3xl border border-white/10 bg-slate-950/75 px-2 py-2 backdrop-blur-md">
      <View className="relative justify-center">
        <View className="absolute h-1.5 w-full rounded-full bg-white/10" />
        <View
          className="absolute h-1.5 rounded-full bg-sky-400"
          style={{ width: progressPercent }}
        />

        <Slider
          value={displayedValue}
          minimumValue={0}
          maximumValue={safeDuration || 1}
          minimumTrackTintColor="transparent"
          maximumTrackTintColor="transparent"
          thumbTintColor="#ffffff"
          onSlidingStart={() => {
            setIsSliding(true);
            onSeekStart?.();
          }}
          onValueChange={(value) => {
            setLocalValue(value);
            onSeekChange?.(value);
          }}
          onSlidingComplete={(value) => {
            setIsSliding(false);
            setLocalValue(value);
            onSeekComplete(value);
          }}
          style={{ height: 28 }}
        />
      </View>
    </View>
  );
}