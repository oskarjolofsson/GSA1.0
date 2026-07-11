import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import LoadingState from "features/shared/components/LoadingState";
import ErrorState from "features/shared/components/ErrorState";
import { getIssueCatalog, type CatalogIssue } from "features/issues/services/issueAuthoringService";
import { generateProgramFromIssue } from "features/programs/services/programService";
import { getErrorMessage } from "lib/errors";

import { AREAS, type PhaseKey } from "./constants/Areas";
import SearchBar from "./components/SearchBar";
import AreaSection from "./components/AreaSection";

type Props = {
    onCancel: () => void;
    onDone: () => void;
};

/** Browse the practice library (global catalog + your own customs), grouped by area
 *  of the game, and start a plan from an issue. */
export default function LibraryScreen({ onCancel, onDone }: Props) {
    const insets = useSafeAreaInsets();
    const [issues, setIssues] = useState<CatalogIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [startingId, setStartingId] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [phase, setPhase] = useState<PhaseKey | null>(null);

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

    // Group by area once; each section then applies search + (full-swing) phase filter.
    const byArea = useMemo(() => {
        const map = new Map<string, CatalogIssue[]>();
        for (const issue of issues) {
            const key = issue.area ?? "FULL_SWING";
            const bucket = map.get(key);
            if (bucket) bucket.push(issue);
            else map.set(key, [issue]);
        }
        return map;
    }, [issues]);

    const matches = useCallback(
        (issue: CatalogIssue, isFullSwing: boolean) => {
            const q = query.trim().toLowerCase();
            if (q) {
                const hay = `${issue.title} ${issue.description ?? ""}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (isFullSwing && phase && issue.phase !== phase) return false;
            return true;
        },
        [query, phase]
    );

    if (loading) return <LoadingState title="Loading the library" subtitle="Fetching the library…" />;
    if (error && issues.length === 0) {
        return <ErrorState title="Couldn't load the library" message={error} buttonText="Retry" onRetry={load} />;
    }

    return (
        <View className="flex-1 bg-[#050816]" style={{ paddingTop: insets.top }}>
            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                <Pressable onPress={onCancel} className="mb-4 flex-row items-center active:opacity-70">
                    <ChevronLeft size={20} color="#94a3b8" />
                    <Text className="ml-1 text-slate-400">Back</Text>
                </Pressable>

                <Text className="text-3xl font-bold text-white">Browse the library</Text>
                <Text className="mt-2 mb-6 leading-6 text-slate-400">
                    Pick an issue to work on. Tap to see its drills, then start a plan.
                </Text>

                <SearchBar value={query} onChange={setQuery} />

                {AREAS.map((area) => {
                    const isFullSwing = area.key === "FULL_SWING";
                    const all = byArea.get(area.key) ?? [];
                    const shown = all.filter((i) => matches(i, isFullSwing));
                    return (
                        <AreaSection
                            key={area.key}
                            area={area}
                            issues={shown}
                            totalInArea={all.length}
                            expandedId={expandedId}
                            startingId={startingId}
                            onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                            onStart={start}
                            showPhaseFilter={isFullSwing}
                            phase={phase}
                            onPhaseSelect={setPhase}
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
}
