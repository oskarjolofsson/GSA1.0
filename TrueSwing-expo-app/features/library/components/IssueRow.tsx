import { View, Text, Pressable } from "react-native";
import { ChevronRight } from "lucide-react-native";

import type { CatalogIssue } from "features/issues/services/issueAuthoringService";

type Props = {
    issue: CatalogIssue;
    onOpen: () => void;
};

/**
 * One startable focus, as a row. Tapping opens `IssueSheet`.
 *
 * This used to expand in place. It stopped because the expanded state had to fit a
 * description, a drill list and a primary action inside a card inside a padded scroll
 * view, which capped the reading column at 311pt on a 393pt phone and pushed the next
 * focus most of a screen down. The sheet gives that content the whole width and puts
 * the action somewhere fixed. The row's only job now is to be scannable.
 */
export default function IssueRow({ issue, onOpen }: Props) {
    const drillCount = issue.drills.length;

    return (
        <Pressable
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityHint="Opens this focus and its drills"
            className="min-h-[56px] flex-row items-center border-b border-white/[.07] py-4 active:opacity-70"
        >
            <View className="flex-1 pr-3">
                {/* Lead with plain language; fall back to the coach title. */}
                <Text className="font-display text-[17px] leading-[22px] text-sand">
                    {issue.layman_title || issue.title}
                </Text>
                {issue.source === "custom" ? (
                    <Text className="mt-1 text-[10px] uppercase tracking-[2.6px] text-gold">
                        Your custom focus
                    </Text>
                ) : null}
            </View>
            <Text className="mr-2 text-[13px] text-sand-dim">
                {drillCount} {drillCount === 1 ? "drill" : "drills"}
            </Text>
            <ChevronRight size={16} color="#8A8676" />
        </Pressable>
    );
}
