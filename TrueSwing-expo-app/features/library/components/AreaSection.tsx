import { View, Text } from "react-native";

import type { CatalogIssue } from "features/issues/services/issueAuthoringService";
import type { Area, PhaseKey } from "../constants/Areas";
import IssueCard from "./IssueCard";
import PhaseFilterChips from "./PhaseFilterChips";

type Props = {
    area: Area;
    /** Issues in this area after search + phase filtering — what actually renders. */
    issues: CatalogIssue[];
    /** How many issues this area holds before any filtering. 0 => "Coming soon". */
    totalInArea: number;
    expandedId: string | null;
    startingId: string | null;
    onToggle: (id: string) => void;
    onStart: (issue: CatalogIssue) => void;
    // Phase filter — only wired for the Full swing section.
    showPhaseFilter?: boolean;
    phase?: PhaseKey | null;
    onPhaseSelect?: (phase: PhaseKey | null) => void;
};

/** One area of the game. Populated areas list their issues; empty areas render a
 *  "Coming soon" teaser so the roadmap is visible. When a filter hides every issue
 *  in a populated area, we say "No issues match" rather than "Coming soon". */
export default function AreaSection({
    area,
    issues,
    totalInArea,
    expandedId,
    startingId,
    onToggle,
    onStart,
    showPhaseFilter,
    phase,
    onPhaseSelect,
}: Props) {
    const comingSoon = totalInArea === 0;

    return (
        <View className="mb-8">
            <View className="mb-4 flex-row items-center">
                <Text className="text-xl font-bold text-white">{area.label}</Text>
                {comingSoon ? (
                    <Text className="ml-3 rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
                        Coming soon
                    </Text>
                ) : (
                    <Text className="ml-2 text-sm text-slate-500">{totalInArea}</Text>
                )}
            </View>

            {comingSoon ? (
                <Text className="leading-6 text-slate-500">
                    We&apos;re building out {area.label.toLowerCase()} drills. Check back soon.
                </Text>
            ) : (
                <>
                    {showPhaseFilter && onPhaseSelect ? (
                        <PhaseFilterChips selected={phase ?? null} onSelect={onPhaseSelect} />
                    ) : null}
                    {issues.length === 0 ? (
                        <Text className="leading-6 text-slate-500">No issues match your filters.</Text>
                    ) : (
                        issues.map((issue) => (
                            <IssueCard
                                key={issue.id}
                                issue={issue}
                                expanded={expandedId === issue.id}
                                starting={startingId === issue.id}
                                onToggle={() => onToggle(issue.id)}
                                onStart={() => onStart(issue)}
                            />
                        ))
                    )}
                </>
            )}
        </View>
    );
}
