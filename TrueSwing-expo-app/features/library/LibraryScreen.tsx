import { useCallback, useEffect, useRef, useState } from "react";
import { View, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";

import { generateProgramFromIssue } from "features/programs/services/programService";
import type { CatalogIssue } from "features/issues/services/issueAuthoringService";
import { getErrorMessage, ApiError } from "lib/errors";
import colors from "lib/colors";
import { useBilling } from "features/billing/BillingContext";
import Header from "features/shared/components/Header";
import StepTransition from "features/shared/components/StepTransition";

import { useLibraryState, type LibraryView } from "./hooks/useLibraryState";
import useAreaStats from "./hooks/useAreaStats";
import SearchBar from "./components/SearchBar";
import AreaGrid from "./components/AreaGrid";
import AreaEmptyState from "./components/AreaEmptyState";
import KindChoice from "./components/KindChoice";
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

// Depth of each view in the areas -> kind -> focus -> candidates hierarchy.
// Drives the step transition's push direction the same way intro's
// PICKABLE_STEPS index does, but keyed off the library's own state instead of
// a linear step list.
const VIEW_DEPTH: Record<LibraryView, number> = { areas: 0, kind: 1, focus: 2, candidates: 3 };

/** Browse the practice library by AREA -> (fix something | get better) ->
 *  plain-language focus, or search. Same fork intro asks about right after
 *  the area, one level earlier than the old combined miss/goal list. The AI
 *  and coach paths already diagnose from video or notes; this is the manual
 *  path. Layout only -- state lives in useLibraryState. */
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
    const { setPendingRetry, openPaywall } = useBilling();

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
                if (err instanceof ApiError && err.status === 402) {
                    setOpenIssue(null);
                    openPaywall('gate', 'focus_limit');
                    setPendingRetry(() => start(issue));
                } else {
                    setStartError(getErrorMessage(err));
                }
            } finally {
                setStartingId(null);
            }
        },
        [onDone, setPendingRetry]
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
          : lib.view === "kind"
            ? "What are you\nhere for?"
            : lib.view === "focus"
              ? lib.kind === "skill"
                  ? "What's the\ngoal?"
                  : "What does it\nlook like?"
              : (lib.filter?.label ?? "Your focus");

    // Direction/variant for StepTransition. depth tracks lib.view's position in
    // the hierarchy; search is orthogonal to it (can open from any depth), so
    // entering/leaving search fades rather than pushing in a direction that
    // wouldn't mean anything.
    const depth = VIEW_DEPTH[lib.view];
    const previousDepthRef = useRef(depth);
    const previousSearchingRef = useRef(searching);
    const direction: 1 | -1 = depth >= previousDepthRef.current ? 1 : -1;
    const enteringOrLeavingSearch = searching !== previousSearchingRef.current;
    const transitionVariant: "push" | "fade" = enteringOrLeavingSearch ? "fade" : "push";
    useEffect(() => {
        previousDepthRef.current = depth;
        previousSearchingRef.current = searching;
    }, [depth, searching]);

    return (
        <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
            {/* Fixed chrome: header and search bar don't scroll away, so
                StepTransition below always animates against the same fixed point,
                the way each intro step slides under its own static header band. */}
            <View className="px-5 pt-2">
                <Header
                    eyebrow={eyebrow}
                    heading={heading}
                    onBack={goBack}
                    backLabel="Back"
                    align="center"
                    rightSlot={
                        showSearchIcon ? (
                            <Pressable
                                onPress={() => setSearchOpen(true)}
                                accessibilityRole="button"
                                accessibilityLabel="Search focus points"
                                hitSlop={8}
                                className="-mr-2 h-[44px] w-[44px] items-center justify-center active:opacity-70"
                            >
                                <Search size={19} color={colors['sand-dim']} />
                            </Pressable>
                        ) : undefined
                    }
                />

                {/* Search is flat over focus points and bypasses the hierarchy, so it
                    stays reachable at every level -- behind an icon on the landing,
                    inline everywhere else. */}
                {showSearchBar ? (
                    <SearchBar value={lib.query} onChange={lib.setQuery} autoFocus={searchOpen} />
                ) : null}
            </View>

            {/* flex-1 region StepTransition's absolute-fill MotiView animates
                within. Body gets its own ScrollView here since the page-level one
                that used to size it by content is gone -- that scroll now has to
                happen inside this fixed-height region instead. */}
            <View className="flex-1">
                <StepTransition
                    screenKey={`${lib.view}:${lib.area?.key ?? ""}:${lib.filter?.label ?? ""}:${searching}`}
                    direction={direction}
                    variant={transitionVariant}
                >
                    <ScrollView
                        contentContainerStyle={
                            // The kind step is two short-lived cards, not a list --
                            // centered in the remaining space instead of sitting
                            // tight under the search bar the way a scrolling list
                            // starts. Every other view keeps its natural top-down
                            // flow, where centering would fight the reading order.
                            lib.view === "kind" && !searching
                                ? { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 48, justifyContent: "center" }
                                : { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 }
                        }
                        keyboardShouldPersistTaps="handled"
                    >
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
                    </ScrollView>
                </StepTransition>
            </View>

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

    if (lib.view === "kind") {
        if (lib.catalogStatus === "loading" || lib.taxonomyStatus === "loading") {
            return <SkeletonRows count={2} />;
        }
        if (lib.taxonomyStatus === "error") {
            return <InlineRetry message={lib.taxonomyError} onRetry={lib.retryTaxonomy} />;
        }
        if (lib.catalogStatus === "error") {
            return <InlineRetry message={lib.catalogError} onRetry={lib.retryCatalog} />;
        }
        const fork = lib.fork;
        const skillAvailable = (fork?.goals.length ?? 0) > 0;
        const faultAvailable = (fork?.misses.length ?? 0) > 0;
        if (!skillAvailable && !faultAvailable) {
            return <AreaEmptyState areaLabel={lib.area?.golfer_label ?? "This"} onBack={onBackToAreas} />;
        }
        return (
            <KindChoice
                skillAvailable={skillAvailable}
                faultAvailable={faultAvailable}
                onSelect={lib.chooseKind}
            />
        );
    }

    if (lib.view === "focus") {
        if (lib.catalogStatus === "loading") return <SkeletonRows count={4} />;
        if (lib.catalogStatus === "error") {
            return <InlineRetry message={lib.catalogError} onRetry={lib.retryCatalog} />;
        }
        const fork = lib.fork;
        const items = lib.kind === "skill" ? (fork?.goals ?? []) : (fork?.misses ?? []);
        if (items.length === 0) {
            return <AreaEmptyState areaLabel={lib.area?.golfer_label ?? "This"} onBack={onBackToAreas} />;
        }
        return (
            <MissList
                items={items}
                areaKey={lib.area?.key ?? ""}
                onSelect={(item) =>
                    lib.openFilter(
                        lib.kind === "skill"
                            ? { type: "goal", goal: item.key, label: item.golfer_label }
                            : { type: "miss", miss: item.key, label: item.golfer_label }
                    )
                }
                onFilmSwing={onFilmSwing}
            />
        );
    }

    return leaf("No focus points here yet.");
}

