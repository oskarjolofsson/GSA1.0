import { View, Text, Pressable } from "react-native";
import { ChevronDown, ChevronRight } from "lucide-react-native";

import type { CatalogIssue } from "features/issues/services/issueAuthoringService";

type Props = {
    issue: CatalogIssue;
    expanded: boolean;
    starting: boolean;
    onToggle: () => void;
    onStart: () => void;
};

/** One expandable catalog issue: header (title + drill count), and when open, its
 *  description, drills, and a "Start this plan" button. */
export default function IssueCard({ issue, expanded, starting, onToggle, onStart }: Props) {
    return (
        <View className="mb-4 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
            <Pressable onPress={onToggle} className="flex-row items-center px-5 py-4 active:opacity-80">
                {expanded ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronRight size={18} color="#94a3b8" />}
                <View className="ml-3 flex-1">
                    {/* Lead with plain language; fall back to the coach title. */}
                    <Text className="text-base font-bold text-white">{issue.layman_title || issue.title}</Text>
                    {issue.source === "custom" ? (
                        <Text className="mt-0.5 text-xs font-semibold text-emerald-300">Your custom focus</Text>
                    ) : null}
                </View>
                <Text className="ml-2 text-xs text-slate-500">{issue.drills.length} drills</Text>
            </Pressable>

            {expanded ? (
                <View className="px-5 pb-5">
                    {issue.layman_desc || issue.description ? (
                        <Text className="mb-3 leading-6 text-slate-400">{issue.layman_desc || issue.description}</Text>
                    ) : null}
                    {issue.drills.map((d) => (
                        <View key={d.id} className="mb-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                            <Text className="font-semibold text-white">{d.title}</Text>
                            <Text className="mt-1 text-sm leading-5 text-slate-400">{d.task}</Text>
                        </View>
                    ))}
                    <Pressable
                        onPress={onStart}
                        disabled={starting}
                        className={`mt-3 rounded-2xl px-5 py-4 items-center ${starting ? "bg-white/10" : "bg-emerald-600 active:opacity-80"}`}
                    >
                        <Text className={`text-base font-semibold ${starting ? "text-slate-500" : "text-white"}`}>
                            {starting ? "Starting…" : "Start this plan"}
                        </Text>
                    </Pressable>
                </View>
            ) : null}
        </View>
    );
}
