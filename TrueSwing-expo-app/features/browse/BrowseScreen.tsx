import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react-native";

import LoadingState from "features/shared/components/LoadingState";
import ErrorState from "features/shared/components/ErrorState";
import { getIssueCatalog, type CatalogIssue } from "features/issues/services/issueAuthoringService";
import { generateProgramFromIssue } from "features/programs/services/programService";
import { getErrorMessage } from "lib/errors";

type Props = {
    onCancel: () => void;
    onDone: () => void;
};

/** Browse the issue library (global catalog + your own customs) and start one. */
export default function BrowseScreen({ onCancel, onDone }: Props) {
    const insets = useSafeAreaInsets();
    const [issues, setIssues] = useState<CatalogIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [startingId, setStartingId] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setIssues(await getIssueCatalog());
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const start = useCallback(async (issue: CatalogIssue) => {
        setStartingId(issue.id);
        setError(null);
        try {
            await generateProgramFromIssue(issue.id);
            onDone();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setStartingId(null);
        }
    }, [onDone]);

    if (loading) return <LoadingState title="Loading drills" subtitle="Fetching the library…" />;
    if (error && issues.length === 0) {
        return <ErrorState title="Couldn't load drills" message={error} buttonText="Retry" onRetry={load} />;
    }

    return (
        <View className="flex-1 bg-[#050816]" style={{ paddingTop: insets.top }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Pressable onPress={onCancel} className="mb-4 flex-row items-center active:opacity-70">
                    <ChevronLeft size={20} color="#94a3b8" />
                    <Text className="ml-1 text-slate-400">Back</Text>
                </Pressable>

                <Text className="text-3xl font-bold text-white">Browse drills</Text>
                <Text className="mt-2 mb-6 leading-6 text-slate-400">
                    Pick an issue to work on. Tap to see its drills, then start a plan.
                </Text>

                {issues.map((issue) => {
                    const expanded = expandedId === issue.id;
                    return (
                        <View key={issue.id} className="mb-4 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                            <Pressable
                                onPress={() => setExpandedId(expanded ? null : issue.id)}
                                className="flex-row items-center px-5 py-4 active:opacity-80"
                            >
                                {expanded ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronRight size={18} color="#94a3b8" />}
                                <View className="ml-3 flex-1">
                                    <Text className="text-base font-bold text-white">{issue.title}</Text>
                                    {issue.source === "custom" ? (
                                        <Text className="mt-0.5 text-xs font-semibold text-emerald-300">Your custom focus</Text>
                                    ) : null}
                                </View>
                                <Text className="ml-2 text-xs text-slate-500">{issue.drills.length} drills</Text>
                            </Pressable>

                            {expanded ? (
                                <View className="px-5 pb-5">
                                    {issue.description ? (
                                        <Text className="mb-3 leading-6 text-slate-400">{issue.description}</Text>
                                    ) : null}
                                    {issue.drills.map((d) => (
                                        <View key={d.id} className="mb-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
                                            <Text className="font-semibold text-white">{d.title}</Text>
                                            <Text className="mt-1 text-sm leading-5 text-slate-400">{d.task}</Text>
                                        </View>
                                    ))}
                                    <Pressable
                                        onPress={() => start(issue)}
                                        disabled={startingId === issue.id}
                                        className={`mt-3 rounded-2xl px-5 py-4 items-center ${startingId === issue.id ? "bg-white/10" : "bg-emerald-600 active:opacity-80"}`}
                                    >
                                        <Text className={`text-base font-semibold ${startingId === issue.id ? "text-slate-500" : "text-white"}`}>
                                            {startingId === issue.id ? "Starting…" : "Start this plan"}
                                        </Text>
                                    </Pressable>
                                </View>
                            ) : null}
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}
