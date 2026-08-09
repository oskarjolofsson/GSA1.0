import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Search } from "lucide-react-native";

import { generateProgramFromIssue } from "features/programs/services/programService";
import type { CatalogIssue } from "features/issues/services/issueAuthoringService";
import { getErrorMessage } from "lib/errors";

import { useLibraryState } from "./hooks/useLibraryState";
import useAreaStats from "./hooks/useAreaStats";
import SearchBar from "./components/SearchBar";
import AreaGrid from "./components/AreaGrid";
import AreaEmptyState from "./components/AreaEmptyState";
import MissList from "./components/MissList";
import CandidateList from "./components/CandidateList";
import IssueSheet from "./components/IssueSheet";
import SkeletonRows from "./components/SkeletonRows";
import InlineRetry from "./components/InlineRetry";

type Props = {
    onCancel: () => void;
    /** Carries the started focus's area so home can open that tab. */
    onDone: (areaKey?: string) => void;
    /** Hand off to the AI/film path when the golfer can't self-identify. */
    onFilmSwing?: () => void;
    /** Open straight into this area instead of the landing grid. Set when the
     *  golfer arrived from home's "Find bunker work", which already named it. */
    initialAreaKey?: string;
};

/** Browse the practice library by AREA -> (miss | goal) -> plain-language focus,
 *  or search. The AI and coach paths already diagnose from video or notes; this
 *  is the manual path. Layout only -- state lives in useLibraryState. */
export default function LibraryScreen({ onCancel, onDone, onFilmSwing, initialAreaKey }: Props) {
    const insets = useSafeAreaInsets();
    const lib = useLibraryState(initialAreaKey);
    const statsByArea = useAreaStats();
    const [startingId, setStartingId] = useState<string | null>(null);
    // Search is collapsed to an icon on the landing, where five self-evident rows
    // mean nobody searches and the bar was costing a row above the fold. Every
    // deeper view keeps it inline -- those lists are long enough to earn it.
    const [searchOpen, setSearchOpen] = useState(false);
    // The focus whose sheet is open. Holding the issue itself (not an id) keeps the
    // sheet rendering its own content while it animates out after a filter change.
    const [openIssue, setOpenIssue] = useState<CatalogIssue | null>(null);
    const [startError, setStartError] = useState<string | null>(null);

    const start = useCallback(
        async (issue: CatalogIssue) => {
            setStartingId(issue.id);
            setStartError(null);
            try {
                await generateProgramFromIssue(issue.id);
                setOpenIssue(null);
                // The issue's own area, not `lib.area` — a search result can come
                // from an area the golfer never navigated into.
                onDone(issue.area);
            } catch (err) {
                // Leave the sheet open on failure -- the error renders behind it
                // otherwise, and the golfer sees a dismissed sheet and no explanation.
                setStartError(getErrorMessage(err));
            } finally {
                setStartingId(null);
            }
        },
        [onDone]
    );

    const goBack = useCallback(() => {
        setOpenIssue(null);
        // Collapsing the search bar is a step back in its own right: leaving it
        // open on the landing would undo the thing the icon exists for.
        if (searchOpen && !lib.query) {
            setSearchOpen(false);
            return;
        }
        if (!lib.goBack()) onCancel();
    }, [lib, onCancel, searchOpen]);

    const searching = lib.query.trim().length > 0;
    const onLanding = lib.view === "areas" && !searching;
    const showSearchIcon = onLanding && !searchOpen;
    const showSearchBar = !onLanding || searchOpen;
    const eyebrow = lib.area ? lib.area.golfer_label : "The library";
    const heading = searching
        ? "Search"
        : lib.view === "areas"
          ? "Where do you\nlose shots?"
          : lib.view === "focus"
            ? "What brings\nyou here?"
            : (lib.filter?.label ?? "Your focus");

    return (
        <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="min-h-[44px] flex-row items-center justify-between">
                    <Pressable
                        onPress={goBack}
                        accessibilityRole="button"
                        className="min-h-[44px] flex-row items-center pr-3 active:opacity-70"
                    >
                        <ChevronLeft size={16} color="#8A8676" />
                        <Text className="ml-1 text-[13px] text-sand-dim">Back</Text>
                    </Pressable>

                    {showSearchIcon ? (
                        <Pressable
                            onPress={() => setSearchOpen(true)}
                            accessibilityRole="button"
                            accessibilityLabel="Search focus points"
                            hitSlop={8}
                            className="-mr-2 h-[44px] w-[44px] items-center justify-center active:opacity-70"
                        >
                            <Search size={19} color="#8A8676" />
                        </Pressable>
                    ) : null}
                </View>

                <Text className="mt-4 text-[10px] uppercase tracking-[2.6px] text-gold">{eyebrow}</Text>
                <Text className="mt-3 font-display text-[29px] leading-[33px] text-sand">{heading}</Text>

                {/* Search is flat over focus points and bypasses the hierarchy, so it
                    stays reachable at every level -- behind an icon on the landing,
                    inline everywhere else. */}
                {showSearchBar ? (
                    <SearchBar value={lib.query} onChange={lib.setQuery} autoFocus={searchOpen} />
                ) : null}

                {/* Keyed so the row stagger replays on every move through the
                    hierarchy. Library navigation is state, not a remount, so without
                    this the entrance would only ever play once per visit. */}
                <View key={`${lib.view}:${lib.area?.key ?? ""}:${lib.filter?.label ?? ""}:${searching}`}>
                    <Body
                        lib={lib}
                        statsByArea={statsByArea}
                        searching={searching}
                        onOpen={(issue) => {
                            setStartError(null);
                            setOpenIssue(issue);
                        }}
                        onBackToAreas={goBack}
                        onFilmSwing={onFilmSwing}
                    />
                </View>
            </ScrollView>

            {/* Outside the ScrollView: a Modal is its own layer, and nesting it inside a
                scroll container makes its scrim mis-measure on Android. */}
            <IssueSheet
                issue={openIssue}
                areaLabel={lib.area?.golfer_label ?? "Full swing"}
                starting={startingId === openIssue?.id}
                error={startError}
                onClose={() => setOpenIssue(null)}
                onStart={() => openIssue && start(openIssue)}
            />
        </View>
    );
}

function Body({
    lib,
    statsByArea,
    searching,
    onOpen,
    onBackToAreas,
    onFilmSwing,
}: {
    lib: ReturnType<typeof useLibraryState>;
    statsByArea: ReturnType<typeof useAreaStats>;
    searching: boolean;
    onOpen: (issue: CatalogIssue) => void;
    onBackToAreas: () => void;
    onFilmSwing?: () => void;
}) {
    const leaf = (emptyText: string) => (
        <CandidateList
            candidates={lib.candidates}
            emptyText={emptyText}
            onOpen={onOpen}
        />
    );

    if (searching) {
        if (lib.catalogStatus === "loading") return <SkeletonRows count={3} />;
        if (lib.catalogStatus === "error") {
            return <InlineRetry message={lib.catalogError} onRetry={lib.retryCatalog} />;
        }
        return leaf("No focus points match your search.");
    }

    if (lib.view === "areas") {
        // The landing renders from the taxonomy alone: a dead issue catalog must
        // not hide five working areas behind a full-screen error.
        if (lib.taxonomyStatus === "loading") return <SkeletonRows />;
        if (lib.taxonomyStatus === "error") {
            return <InlineRetry message={lib.taxonomyError} onRetry={lib.retryTaxonomy} />;
        }
        return <AreaGrid areas={lib.areas} statsByArea={statsByArea} onSelect={lib.openArea} />;
    }

    if (lib.view === "focus") {
        if (lib.catalogStatus === "loading") return <SkeletonRows count={4} />;
        if (lib.catalogStatus === "error") {
            return <InlineRetry message={lib.catalogError} onRetry={lib.retryCatalog} />;
        }
        const fork = lib.fork;
        if (!fork || (fork.misses.length === 0 && fork.goals.length === 0)) {
            return <AreaEmptyState areaLabel={lib.area?.golfer_label ?? "This"} onBack={onBackToAreas} />;
        }
        return (
            <MissList
                fork={fork}
                areaKey={lib.area?.key ?? ""}
                onSelectMiss={(miss) =>
                    lib.openFilter({ type: "miss", miss: miss.key, label: miss.golfer_label })
                }
                onSelectGoal={(goal) =>
                    lib.openFilter({ type: "goal", goal: goal.key, label: goal.golfer_label })
                }
                onFilmSwing={onFilmSwing}
            />
        );
    }

    return leaf("No focus points here yet.");
}

