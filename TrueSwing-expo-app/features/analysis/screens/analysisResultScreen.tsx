import { useCallback, useEffect, useRef, useState } from "react";
import {
    View,
    FlatList,
    Dimensions,
} from "react-native";

import Welcome from "../components/Welcome";

import LoadingState from "features/shared/components/LoadingState";
import ErrorState from "features/shared/components/ErrorState";
import TextBox from "features/shared/components/TextBox";
import InactiveAnalysisReel from "features/analysis/components/InActiveReel";
import AnalysisHeaderOverlay from "features/analysis/components/AnalysisHeaderOverlay";
import DeleteConfirmation from "features/analysis/components/DeleteConfirmation";
import AnalysisReelItem from "features/analysis/components/AnalysisReelItem";
import { useHomeAnalysis } from "features/home/context/HomeAnalysisContext";
import { useRouter } from "expo-router";
import { Issue } from "features/issues/types";

const { height } = Dimensions.get("window");

type AnalysisResultScreenProps = {
    onNext: (activeIssue: Issue) => void;
};

export default function AnalysisResultScreen({ onNext }: AnalysisResultScreenProps) {
    const router = useRouter();

    const {
        allAnalyses,
        loading,
        error,
        activeAnalysis,
        activeAnalysisIndex,
        syncActiveAnalysisIndex,
        isDeleting,
        deleteActiveAnalysis,
    } = useHomeAnalysis();
    const reelRef = useRef<FlatList>(null);
    const [issueIndexByAnalysisId, setIssueIndexByAnalysisId] = useState<Record<string, number>>({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeDrawingAnalysisId, setActiveDrawingAnalysisId] = useState<string | null>(null);

    const activeAnalysisId = activeAnalysis?.analysis_id;
    const isDrawingModeActive = activeDrawingAnalysisId !== null;

    const syncActiveAnalysisRef = useRef(syncActiveAnalysisIndex);
    useEffect(() => {
        syncActiveAnalysisRef.current = syncActiveAnalysisIndex;
    }, [syncActiveAnalysisIndex]);

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
            const firstVisible = viewableItems?.[0]?.index;
            if (typeof firstVisible === "number") {
                syncActiveAnalysisRef.current(firstVisible);
            }
        }
    ).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80,
    }).current;

    const handleActiveIssueChange = useCallback(
        (analysisId: string, index: number) => {
            setIssueIndexByAnalysisId((previous) => ({
                ...previous,
                [analysisId]: index,
            }));
        },
        []
    );

    const handleDeleteActiveAnalysis = useCallback(async () => {
        if (!activeAnalysisId) return;

        try {
            await deleteActiveAnalysis();

            setIssueIndexByAnalysisId((previous) => {
                const next = { ...previous };
                delete next[activeAnalysisId];
                return next;
            });
        } finally {
            setShowDeleteConfirm(false);
        }
    }, [activeAnalysisId, deleteActiveAnalysis]);

    const isReady = allAnalyses.length > 0;
    const isInitialLoad = loading && !isReady;

    if (isInitialLoad) return <LoadingState title="Loading Analysis" subtitle="" />;

    if (!loading && error) {
         return <ErrorState title="Failed to load analysis" />;
    }

    if (!allAnalyses.length) {
        return (
            <View className="flex-1 justify-center items-center">
                <Welcome onCreateAnalysis={() => router.push("/(tabs)/upload")} />
            </View>
            
        );
    }

    return (
        <View className="flex-1 bg-black">
            <FlatList
                ref={reelRef}
                data={allAnalyses}
                keyExtractor={(item) => item.analysis_id}
                scrollEnabled={!isDrawingModeActive}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={height}
                snapToAlignment="start"
                disableIntervalMomentum
                getItemLayout={(_, index) => ({
                    length: height,
                    offset: height * index,
                    index,
                })}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item, index }) => {
                    const shouldRender = Math.abs(index - activeAnalysisIndex) <= 1;
                    const isActive = index === activeAnalysisIndex;

                    if (!shouldRender) {
                        return (
                            <InactiveAnalysisReel
                                reelIndex={index}
                                totalAnalyses={allAnalyses.length}
                            />
                        );
                    }

                    return (
                        <AnalysisReelItem
                            analysis={item}
                            isActive={isActive}
                            isDrawingMode={activeDrawingAnalysisId === item.analysis_id}
                            onDrawingModeChange={(nextDrawingMode) => {
                                setActiveDrawingAnalysisId(nextDrawingMode ? item.analysis_id : null);
                            }}
                            activeIssueIndex={issueIndexByAnalysisId[item.analysis_id] ?? 0}
                            onActiveIssueChange={(nextIssueIndex) =>
                                handleActiveIssueChange(item.analysis_id, nextIssueIndex)
                            }
                            startPractice={onNext}
                        />
                    );
                }}
            />

            {activeAnalysis && !isDrawingModeActive ? (
                <AnalysisHeaderOverlay
                    dateLabel={activeAnalysis.created_at ? new Date(activeAnalysis.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    deleting={isDeleting}
                    onDeletePress={() => setShowDeleteConfirm(true)}
                />
            ) : null}

            <DeleteConfirmation
                visible={showDeleteConfirm}
                isLoading={isDeleting}
                onConfirm={handleDeleteActiveAnalysis}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </View>
    );
}