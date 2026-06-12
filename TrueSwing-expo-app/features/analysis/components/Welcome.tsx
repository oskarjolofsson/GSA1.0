import { Pressable, Text, View } from "react-native";
import { Sparkles, Upload } from "lucide-react-native";

type WelcomeCardProps = {
  onCreateAnalysis: () => void;
};

export default function Welcome({
  onCreateAnalysis,
}: WelcomeCardProps) {
  return (
    <View className="flex justify-center items-center mx-4 overflow-hidden  px-6 py-6 shadow-2xl ">
      
    

      {/* headline */}
      <Text className="text-3xl font-extrabold leading-9 text-white">
        Welcome to TrueSwing 👋
      </Text>

      {/* supporting text */}
      <Text className="mt-3 max-w-[95%] text-base leading-6 text-slate-300">
        Upload a swing video. Get better. It’s that simple.
      </Text>

      {/* CTA */}
      <Pressable
        onPress={onCreateAnalysis}
        className="mt-6 rounded-2xl bg-emerald-500 px-5 py-4 active:bg-emerald-400"
      >
        <View className="flex-row items-center gap-3">
          <Upload size={18} color="white" />
          <Text className="text-base font-bold text-white">
            Create your first analysis
          </Text>
        </View>
      </Pressable>

    </View>
  );
}