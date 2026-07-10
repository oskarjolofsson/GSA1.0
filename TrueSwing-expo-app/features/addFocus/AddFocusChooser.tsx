import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Upload, FileText, List, Video } from "lucide-react-native";

import FocusPanel from "./components/FocusPanel";

export type AddFocusChoice = "upload" | "coach" | "browse";

const GOLD = "#E4C892";

// The Upload tab's landing surface: three full-height doors, one per source. Fills
// the screen top (safe area) to bottom (the tab bar sits below this view), no header
// band and no dead space. Design language matches HomeWelcome / PrescriptionCard.
export default function AddFocusChooser({ onChoose }: { onChoose: (c: AddFocusChoice) => void }) {
    const insets = useSafeAreaInsets();
    return (
        <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
            <FocusPanel
                index="01"
                eyebrow="Add a focus"
                icon={<Video size={25} color={GOLD} strokeWidth={2.25} />}
                title="Upload a swing"
                subtitle="Film it. We find the fault."
                onPress={() => onChoose("upload")}
                glowCorner="top-right"
            />
            <View className="border-t border-white/5" />
            <FocusPanel
                index="02"
                icon={<FileText size={25} color={GOLD} strokeWidth={2.25} />}
                title="Coach feedback"
                subtitle="Turn a lesson into a plan."
                onPress={() => onChoose("coach")}
                glowCorner="bottom-left"
            />
            <View className="border-t border-white/5" />
            <FocusPanel
                index="03"
                icon={<List size={25} color={GOLD} strokeWidth={2.25} />}
                title="Browse drills"
                subtitle="Start from a known issue."
                onPress={() => onChoose("browse")}
                glowCorner="top-right"
            />
        </View>
    );
}
