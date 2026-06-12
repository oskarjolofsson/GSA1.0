import { Text, TouchableOpacity, View } from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";

type ErrorStateProps = {
  title?: string;
  message?: string;
  buttonText?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  title = "Something went wrong",
  message = "",
  buttonText = "Try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 bg-[#050816] items-center justify-center px-6">
      <View className="w-full max-w-[360px] rounded-[28px] border border-white/10 bg-[#111111] px-8 py-8 items-center shadow-2xl">
        <View className="h-16 w-16 rounded-full bg-red-500/10 items-center justify-center border border-red-400/20">
          <AlertTriangle size={30} color="#f87171" />
        </View>

        <Text className="mt-5 text-white text-2xl font-bold text-center">
          {title}
        </Text>

        <Text className="mt-3 text-zinc-400 text-base text-center leading-6">
          {message}
        </Text>

        {onRetry ? (
          <TouchableOpacity
            onPress={onRetry}
            activeOpacity={0.85}
            className="mt-7 w-full rounded-2xl bg-white px-5 py-4 flex-row items-center justify-center"
          >
            <RefreshCw size={18} color="#111111" />
            <Text className="ml-2 text-black text-base font-semibold">
              {buttonText}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}