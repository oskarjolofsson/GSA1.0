import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import LoadingState from "features/shared/components/LoadingState";
import ErrorState from "features/shared/components/ErrorState";
import { getIssueCatalog, type CatalogIssue } from "features/issues/services/issueAuthoringService";
import { generateProgramFromIssue } from "features/programs/services/programService";
import { getErrorMessage } from "lib/errors";

import { GOALS, type GoalKey } from "./constants/Goals";
import { missLabel, type MissKey } from "./constants/Misses";
import SearchBar from "./components/SearchBar";
import GoalGrid from "./components/GoalGrid";
import MissList from "./components/MissList";
import IssueCard from "./components/IssueCard";

type Props = {
    onCancel: () => void;
    onDone: () => void;
    /** Hand off to the AI/film path when the golfer can't self-identify. */
    onFilmSwing?: () => void;
};

type LibraryView = "goals" | "misses" | "candidates";
type CandidateFilter = { type: "miss"; miss: MissKey } | { type: "skill"; issueId: string };

/** Browse the practice library by GOAL -> MISS -> plain-language focus, or search.
 *  The AI/coach paths already diagnose from video/notes; this is the manual path. */
export default function LibraryScreen({ onCancel, onDone, onFilmSwing }: Props) {
    const insets = useSafeAreaInsets();
    const [issues, setIssues] = useState<CatalogIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startingId, setStartingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [query, setQuery] = useState("");

    const [view, setView] = useState<LibraryView>("goals");
    const [goal, setGoal] = useState<GoalKey | null>(null);
    const [filter, setFilter] = useState<CandidateFilter | null>(null);

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

    // How many startable focuses sit under each goal (drives the grid's empty state).
    const countByGoal = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const g of GOALS) counts[g.key] = issues.filter((i) => i.goals?.includes(g.key)).length;
        return counts;
    }, [issues]);

    const forGoal = useMemo(
        () => (goal ? issues.filter((i) => i.goals?.includes(goal)) : []),
        [issues, goal]
    );
    const faultIssues = useMemo(() => forGoal.filter((i) => i.kind !== "skill"), [forGoal]);
    const skillFocuses = useMemo(() => forGoal.filter((i) => i.kind === "skill"), [forGoal]);
    // The misses present among this goal's fault issues.
    const missesForGoal = useMemo(() => {
        const set = new Set<string>();
        for (const i of faultIssues) for (const m of i.misses ?? []) set.add(m);
        return Array.from(set);
    }, [faultIssues]);

    // Candidate cards shown at the leaf, or a flat search result set when searching.
    const candidates = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (q) {
            return issues.filter((i) =>
                `${i.layman_title ?? ""} ${i.title} ${i.layman_desc ?? ""} ${i.description ?? ""}`
                    .toLowerCase()
                    .includes(q)
            );
        }
        if (view !== "candidates" || !filter) return [];
        if (filter.type === "skill") return issues.filter((i) => i.id === filter.issueId);
        return faultIssues.filter((i) => i.misses?.includes(filter.miss));
    }, [query, view, filter, issues, faultIssues]);

    const goBack = useCallback(() => {
        if (query) { setQuery(""); return; }
        if (view === "candidates") { setView("misses"); setFilter(null); setExpandedId(null); return; }
        if (view === "misses") { setView("goals"); setGoal(null); return; }
        onCancel();
    }, [query, view, onCancel]);

    if (loading) return <LoadingState title="Loading the library" subtitle="Fetching the library…" />;
    if (error && issues.length === 0) {
        return <ErrorState title="Couldn't load the library" message={error} buttonText="Retry" onRetry={load} />;
    }

    const searching = query.trim().length > 0;
    const heading = searching
        ? "Search"
        : view === "goals"
          ? "What do you want to fix?"
          : view === "misses"
            ? GOALS.find((g) => g.key === goal)?.label ?? "Pick your miss"
            : filter?.type === "miss"
              ? missLabel(filter.miss)
              : "Your focus";

    return (
        <View className="flex-1 bg-[#050816]" style={{ paddingTop: insets.top }}>
            <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                <Pressable onPress={goBack} className="mb-4 flex-row items-center active:opacity-70">
                    <ChevronLeft size={20} color="#94a3b8" />
                    <Text className="ml-1 text-slate-400">Back</Text>
                </Pressable>

                <Text className="text-3xl font-bold text-white">{heading}</Text>
                <Text className="mt-2 mb-6 leading-6 text-slate-400">
                    Pick what you want to work on. Tap a focus to see its drills, then start a plan.
                </Text>

                <SearchBar value={query} onChange={setQuery} />

                {searching ? (
                    <CandidateList
                        candidates={candidates}
                        expandedId={expandedId}
                        startingId={startingId}
                        onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                        onStart={start}
                        emptyText="No focuses match your search."
                    />
                ) : view === "goals" ? (
                    <GoalGrid
                        countByGoal={countByGoal}
                        onSelect={(g) => { setGoal(g); setView("misses"); }}
                    />
                ) : view === "misses" ? (
                    <MissList
                        misses={missesForGoal}
                        skillFocuses={skillFocuses}
                        onSelectMiss={(m) => { setFilter({ type: "miss", miss: m }); setView("candidates"); }}
                        onSelectSkill={(i) => { setFilter({ type: "skill", issueId: i.id }); setView("candidates"); }}
                        onFilmSwing={onFilmSwing}
                    />
                ) : (
                    <CandidateList
                        candidates={candidates}
                        expandedId={expandedId}
                        startingId={startingId}
                        onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
                        onStart={start}
                        emptyText="No focuses here yet."
                    />
                )}
            </ScrollView>
        </View>
    );
}

function CandidateList({
    candidates,
    expandedId,
    startingId,
    onToggle,
    onStart,
    emptyText,
}: {
    candidates: CatalogIssue[];
    expandedId: string | null;
    startingId: string | null;
    onToggle: (id: string) => void;
    onStart: (issue: CatalogIssue) => void;
    emptyText: string;
}) {
    if (candidates.length === 0) {
        return <Text className="leading-6 text-slate-500">{emptyText}</Text>;
    }
    return (
        <>
            {candidates.map((issue) => (
                <IssueCard
                    key={issue.id}
                    issue={issue}
                    expanded={expandedId === issue.id}
                    starting={startingId === issue.id}
                    onToggle={() => onToggle(issue.id)}
                    onStart={() => onStart(issue)}
                />
            ))}
        </>
    );
}
