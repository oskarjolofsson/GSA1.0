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
                    icon={<Video size={26} color={INK} strokeWidth={2.25} />}
                    title="Upload a swing"
                    subtitle="Film it. We find the fault."
                    onPress={() => onChoose("upload")}
                />
                <FocusPanel
                    variant="secondary"
                    icon={<FileText size={22} color={GOLD} strokeWidth={2.25} />}
                    title="Coach feedback"
                    subtitle="Turn a lesson into a plan."
                    onPress={() => onChoose("coach")}
                />
                <FocusPanel
                    variant="secondary"
                    icon={<List size={22} color={GOLD} strokeWidth={2.25} />}
                    title="Browse the library"
                    subtitle="Start from a known issue."
                    onPress={() => onChoose("browse")}
                />
            </View>
        </View>
    );
}
