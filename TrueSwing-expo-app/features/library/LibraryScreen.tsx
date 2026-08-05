import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import { generateProgramFromIssue } from "features/programs/services/programService";
import type { CatalogIssue } from "features/issues/services/issueAuthoringService";
import { getErrorMessage } from "lib/errors";

import { useLibraryState } from "./hooks/useLibraryState";
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
    onDone: () => void;
    /** Hand off to the AI/film path when the golfer can't self-identify. */
    onFilmSwing?: () => void;
};

/** Browse the practice library by AREA -> (miss | goal) -> plain-language focus,
 *  or search. The AI and coach paths already diagnose from video or notes; this
 *  is the manual path. Layout only -- state lives in useLibraryState. */
export default function LibraryScreen({ onCancel, onDone, onFilmSwing }: Props) {
    const insets = useSafeAreaInsets();
    const lib = useLibraryState();
    const [startingId, setStartingId] = useState<string | null>(null);
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
                onDone();
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
        if (!lib.goBack()) onCancel();
    }, [lib, onCancel]);

    const searching = lib.query.trim().length > 0;
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
                <Pressable
                    onPress={goBack}
                    accessibilityRole="button"
                    className="min-h-[44px] flex-row items-center active:opacity-70"
                >
                    <ChevronLeft size={16} color="#8A8676" />
                    <Text className="ml-1 text-[13px] text-sand-dim">Back</Text>
                </Pressable>

                <Text className="mt-4 text-[10px] uppercase tracking-[2.6px] text-gold">{eyebrow}</Text>
                <Text className="mt-3 font-display text-[29px] leading-[33px] text-sand">{heading}</Text>
                {lib.view === "areas" && !searching ? (
                    <Text className="mt-3 text-[13px] leading-[21px] text-sand-dim">
                        Pick the part of your game you want to work on.
                    </Text>
                ) : null}

                {/* Search is flat over focus points and bypasses the hierarchy, so it
                    stays available at every level. */}
                <SearchBar value={lib.query} onChange={lib.setQuery} />

                <Body
                    lib={lib}
                    searching={searching}
                    onOpen={(issue) => {
                        setStartError(null);
                        setOpenIssue(issue);
                    }}
                    onBackToAreas={goBack}
                    onFilmSwing={onFilmSwing}
                />
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
    searching,
    onOpen,
    onBackToAreas,
    onFilmSwing,
}: {
    lib: ReturnType<typeof useLibraryState>;
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
        return <AreaGrid areas={lib.areas} onSelect={lib.openArea} />;
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

