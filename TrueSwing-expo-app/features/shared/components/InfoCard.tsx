import { View, Text } from 'react-native';

export default function InfoCard({
  title,
  text,
  color,
}: {
  title: string;
  text: string;
  color: "yellow" | "green";
}) {
  const styles =
    color === "yellow"
      ? "bg-yellow-500/10 border-yellow-400/20 text-yellow-300"
      : "bg-emerald-500/10 border-emerald-400/20 text-emerald-300";

  return (
    <View className={`p-4 rounded-2xl border ${styles}`}>
      <Text className="font-semibold mb-1">{title}</Text>
      <Text className="text-zinc-300">{text}</Text>
    </View>
  );
}