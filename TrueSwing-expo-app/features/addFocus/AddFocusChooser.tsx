import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, FileText, List } from "lucide-react-native";

import FocusPanel from "./components/FocusPanel";

export type AddFocusChoice = "upload" | "coach" | "browse";

const INK = "#0A0F1A";
const GOLD = "#E4C892";

// The Upload tab's landing surface: a gold hero (the primary AI path) over two quiet
// cards (coach / browse). Fills the screen top (safe area) to the tab bar below.
// Design language matches HomeWelcome / PrescriptionCard.
export default function AddFocusChooser({ onChoose }: { onChoose: (c: AddFocusChoice) => void }) {
    const insets = useSafeAreaInsets();
    return (
        <View className="flex-1 bg-ink px-5" style={{ paddingTop: insets.top + 12, paddingBottom: 12 }}>
            <Text className="mb-5 font-sans-medium text-[11px] uppercase tracking-[2px] text-sand-dim">
                Start a focus
            </Text>

            <View className="flex-1" style={{ gap: 16 }}>
                <FocusPanel
                    variant="hero"
                    icon={<List size={22} color={INK} strokeWidth={2.25} />}
                    title="Browse the library"
                    subtitle="I already know what I want to fix, I want to browse the library the find the correct drills."
                    onPress={() => onChoose("browse")}
                />
                <FocusPanel
                    variant="secondary"
                    icon={<Video size={26} color={GOLD} strokeWidth={2.25} />}
                    title="Upload a swing"
                    subtitle="Film your golf swing and let AI analyze it for you and find the best drills to fix your issues."
                    onPress={() => onChoose("upload")}
                />
                <FocusPanel
                    variant="secondary"
                    icon={<FileText size={22} color={GOLD} strokeWidth={2.25} />}
                    title="Coach feedback"
                    subtitle="I already had a lesson, save all details here in order to not forget and to master the drills!"
                    onPress={() => onChoose("coach")}
                />
            </View>
        </View>
    );
}
