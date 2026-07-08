import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Upload, FileText, List, ChevronRight } from "lucide-react-native";

export type AddFocusChoice = "upload" | "coach" | "browse";

type CardProps = {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
};

function Card({ icon, title, subtitle, onPress }: CardProps) {
    return (
        <Pressable
            onPress={onPress}
            className="mb-4 flex-row items-center rounded-3xl border border-white/10 bg-white/5 px-5 py-5 active:opacity-80"
        >
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-400/20">
                {icon}
            </View>
            <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-white">{title}</Text>
                <Text className="mt-1 leading-5 text-slate-400">{subtitle}</Text>
            </View>
            <ChevronRight size={20} color="#64748b" />
        </Pressable>
    );
}

/** The Upload tab's landing surface: three ways to add a focus to your plan. */
export default function AddFocusChooser({ onChoose }: { onChoose: (c: AddFocusChoice) => void }) {
    const insets = useSafeAreaInsets();
    return (
        <View className="flex-1 bg-[#050816]" style={{ paddingTop: insets.top }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text className="mt-2 text-3xl font-bold text-white">Add a focus</Text>
                <Text className="mt-2 mb-8 leading-6 text-slate-400">
                    Pick where today's plan comes from. You work one focus at a time.
                </Text>

                <Card
                    icon={<Upload size={22} color="#34d399" />}
                    title="Upload a swing"
                    subtitle="Film a swing and let the analysis find your issue."
                    onPress={() => onChoose("upload")}
                />
                <Card
                    icon={<FileText size={22} color="#34d399" />}
                    title="Add coach feedback"
                    subtitle="Turn notes from a real lesson into a practice plan."
                    onPress={() => onChoose("coach")}
                />
                <Card
                    icon={<List size={22} color="#34d399" />}
                    title="Browse drills"
                    subtitle="Pick an existing issue and its drills to work on."
                    onPress={() => onChoose("browse")}
                />
            </ScrollView>
        </View>
    );
}
