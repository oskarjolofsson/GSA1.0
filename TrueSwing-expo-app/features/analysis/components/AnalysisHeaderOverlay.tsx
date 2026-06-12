import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { Trash2 } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AnalysisHeaderOverlayProps = {
  dateLabel?: string;
  onDeletePress: () => void;
  deleting?: boolean;
};

export default function AnalysisHeaderOverlay({
  dateLabel = "",
  onDeletePress,
  deleting = false,
}: AnalysisHeaderOverlayProps) {
  const insets = useSafeAreaInsets();

  const [displayedDate, setDisplayedDate] = useState(dateLabel);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (dateLabel === displayedDate) return;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -8,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDisplayedDate(dateLabel);
      slideAnim.setValue(8);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [dateLabel, displayedDate, fadeAnim, slideAnim]);

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 px-4"
      style={{ top: insets.top + 8 }}
    >
      <View className="overflow-hidden rounded-[28px]">
        <LinearGradient
          colors={[
            "rgba(7, 17, 32, 0.92)",
            "rgba(8, 24, 48, 0.72)",
            "rgba(4, 10, 24, 0.58)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-[28px]"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.28,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 10 },
            elevation: 12,
          }}
        >
          <BlurView
            intensity={28}
            tint="dark"
            className="overflow-hidden rounded-[28px] border border-white/10"
          >
            <View className="flex-row items-center px-4 py-3">
              <View className="w-14 items-start">
                <Pressable
                  onPress={onDeletePress}
                  disabled={deleting}
                  className="h-11 w-11 items-center justify-center rounded-2xl border border-red-400/20 bg-white/5 active:bg-white/10"
                  style={{ opacity: deleting ? 0.55 : 1 }}
                >
                  <Trash2 size={19} color="#f87171" />
                </Pressable>
              </View>

              <View className="flex-1 items-center justify-center">
                <Animated.View
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  }}
                >
                  <Text className="text-[21px] font-semibold tracking-tight text-white">
                    {displayedDate}
                  </Text>
                </Animated.View>
              </View>

              <View className="w-14 items-end justify-center">
                {deleting ? (
                  <Text className="text-xs font-medium text-white/45">
                    Deleting...
                  </Text>
                ) : (
                  <View className="h-11 w-11" />
                )}
              </View>
            </View>

            <View className="h-px bg-white/5" />
          </BlurView>
        </LinearGradient>
      </View>
    </View>
  );
}