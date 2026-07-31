import { Pressable, Text, View } from "react-native";
import { MotiView } from "moti";
import Svg, { Circle, Path } from "react-native-svg";

type AnalysisSuccessProps = {
  onNext: () => void;
  onBack: () => void;
};

export default function AnalysisSuccess({ onNext, onBack }: AnalysisSuccessProps) {
  return (
    <View className="flex-1 items-center justify-center bg-black px-6">
      {/* Success icon + heading */}
      <MotiView
        from={{ opacity: 0, scale: 0.85, translateY: 16 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 14, stiffness: 180 }}
        className="items-center"
      >
        {/* Green circle */}
        <MotiView
          from={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 10, stiffness: 220, delay: 100 }}
          className="mb-6"
        >
          <View className="h-28 w-28 items-center justify-center rounded-full bg-green-500/20">
            {/* SVG checkmark */}
            <MotiView
              from={{ opacity: 0, scale: 0.6, rotate: "-20deg" }}
              animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
              transition={{ type: "spring", damping: 10, stiffness: 240, delay: 250 }}
            >
              <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
                <Circle cx="36" cy="36" r="34" stroke="#22c55e" strokeWidth="3" />
                <Path
                  d="M21 37.5L31 47.5L51 27.5"
                  stroke="#22c55e"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </MotiView>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300, type: "timing", duration: 450 }}
        >
          <Text className="text-center text-3xl font-bold text-white">
            Analysis Complete!
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 430, type: "timing", duration: 400 }}
        >
          <Text className="mt-2 text-center text-base text-zinc-400">
            Your results are ready
          </Text>
        </MotiView>
      </MotiView>

      {/* Button entrance */}
      <MotiView
        from={{ opacity: 0, translateY: 20, scale: 0.92 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ delay: 600, type: "spring", damping: 12, stiffness: 180 }}
        className="mt-12 w-full max-w-xs"
      >
        {/* Subtle pulse */}
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: 1.03 }}
          transition={{
            type: "timing",
            duration: 900,
            loop: true,
            repeatReverse: true,
          }}
        >
          <Pressable
            onPress={onNext}
            className="items-center rounded-2xl bg-green-500 px-6 py-4 active:opacity-90"
          >
            <Text className="text-lg font-semibold text-white">
              View Results
            </Text>
          </Pressable>
        </MotiView>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 16, scale: 0.96 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ delay: 250, type: "spring", damping: 16, stiffness: 200 }}
        className="mt-10 w-full px-6"
      >
        <Pressable
          onPress={onBack}
          className="w-full flex-row items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 active:opacity-80"
          style={({ pressed }) => ({
            transform: [{ scale: pressed ? 0.985 : 1 }],
          })}
        >
          <Text className="text-white">
            Go Back
          </Text>
        </Pressable>
      </MotiView>
    </View>
  );
}