import { View, Text, Pressable } from "react-native";
import { Check } from "lucide-react-native";

import { tapHaptic } from "../utils/haptics";
import type { IntroIssue } from "../services/introCatalogService";

type Props = {
    issues: IntroIssue[];
    selectedId: string | null;
    onSelect: (issue: IntroIssue) => void;
};

/**
 * The area's focus points, one of which the golfer picks.
 *
 * Selection rather than the library's navigation: `IssueRow` opens a sheet, because
 * inside the app the next step is starting a program right now. Here the next step
 * is signing up, so the row's whole job is to hold a choice and show that it is held.
 */
export default function IntroFocusList({ issues, selectedId, onSelect }: Props) {
    return (
        <View className="mt-6">
            {issues.map((issue, index) => {
                const selected = issue.id === selectedId;
                const drills = issue.drills.length;

                return (
                    <Pressable
                        key={issue.id}
                        onPress={() => {
                            tapHaptic();
                            onSelect(issue);
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        className={`min-h-[64px] flex-row items-center py-4 active:opacity-70 ${
                            index === issues.length - 1 ? "" : "border-b border-white/[.07]"
                        }`}
                    >
                        <View className="flex-1 pr-3">
                            {/* Plain language first, coach title as the fallback — the
                                same order IssueRow uses. */}
                            <Text
                                className={`font-display text-[17px] leading-[22px] ${
                                    selected ? "text-gold" : "text-sand"
                                }`}
                            >
                                {issue.layman_title || issue.title}
                            </Text>
                            <Text className="mt-1 text-[13px] leading-[18px] text-sand-dim">
                                {drills} {drills === 1 ? "drill" : "drills"}
                            </Text>
                        </View>

                        {/* An empty ring, not empty space: five rows with nothing on the
                            right do not read as a thing you choose between. */}
                        <View
                            className={`h-[26px] w-[26px] items-center justify-center rounded-full border ${
                                selected ? "border-gold bg-gold" : "border-white/20"
                            }`}
                        >
                            {selected ? <Check size={15} color="#0A0F1A" strokeWidth={3} /> : null}
                        </View>
                    </Pressable>
                );
            })}
        </View>
    );
}
