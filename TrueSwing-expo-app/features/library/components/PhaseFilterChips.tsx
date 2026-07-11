import { Text, Pressable, ScrollView } from "react-native";

import { PHASES, phaseLabel, type PhaseKey } from "../constants/Areas";

type Props = {
    selected: PhaseKey | null;
    onSelect: (phase: PhaseKey | null) => void;
};

/** Horizontal chip row to filter full-swing issues by swing phase. Tapping the
 *  active chip clears the filter. */
export default function PhaseFilterChips({ selected, onSelect }: Props) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{ gap: 8 }}
        >
            {PHASES.map((phase) => {
                const active = selected === phase;
                return (
                    <Pressable
                        key={phase}
                        onPress={() => onSelect(active ? null : phase)}
                        className={`rounded-full border px-4 py-2 active:opacity-70 ${
                            active ? "border-emerald-500 bg-emerald-600" : "border-white/10 bg-white/5"
                        }`}
                    >
                        <Text className={`text-sm font-semibold ${active ? "text-white" : "text-slate-300"}`}>
                            {phaseLabel(phase)}
                        </Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}
