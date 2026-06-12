import { ActivityIndicator, Text, View } from "react-native";

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

export default function LoadingState({
  title = "Loading",
  subtitle = "Please wait a moment",
}: LoadingScreenProps) {
  return (
    <View className="flex-1 bg-[#050816] items-center justify-center px-6">
      <View className="w-full max-w-[340px] rounded-[28px] border border-white/10 bg-[#111111] px-8 py-10 items-center">
        <ActivityIndicator size="large" color="#76A9FA" />

        <Text className="mt-6 text-white text-2xl font-bold text-center">
          {title}
        </Text>

        <Text className="mt-2 text-zinc-400 text-base text-center">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}