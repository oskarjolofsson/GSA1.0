import { useCallback, useEffect, useMemo, useState } from "react";

import useAnalyses from "features/analysis/hooks/useAnalyses";
import type { Analysis } from "features/analysis/types";
import AnalysisService from "features/analysis/services/analysisService";

export type HomeAnalysisController = {
    allAnalyses: Analysis[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    activeAnalysisIndex: number;
    activeAnalysis: Analysis | null;
    setActiveAnalysisIndex: (index: number) => void;
    syncActiveAnalysisIndex: (index: number) => void;
    isDeleting: boolean;
    deleteActiveAnalysis: () => Promise<void>;
};

export default function useHomeAnalysisController(): HomeAnalysisController {
    const { allAnalyses, loading, error, refetch } = useAnalyses();
    const [activeAnalysisIndex, setActiveAnalysisIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!allAnalyses.length) {
            setActiveAnalysisIndex(0);
            return;
        }

        if (activeAnalysisIndex > allAnalyses.length - 1) {
            setActiveAnalysisIndex(allAnalyses.length - 1);
        }
    }, [allAnalyses.length, activeAnalysisIndex]);

    const activeAnalysis = useMemo(
        () => allAnalyses[activeAnalysisIndex] ?? null,
        [allAnalyses, activeAnalysisIndex]
    );

    const syncActiveAnalysisIndex = useCallback(
        (index: number) => {
            const analysis = allAnalyses[index];
            if (!analysis) return;
            if (index === activeAnalysisIndex) return;

            setActiveAnalysisIndex(index);
        },
        [allAnalyses, activeAnalysisIndex]
    );

    const deleteActiveAnalysis = useCallback(async () => {
        if (!activeAnalysis?.analysis_id) return;

        setIsDeleting(true);
        try {
            await AnalysisService.deleteAnalysis(activeAnalysis.analysis_id);
            await refetch();
        } finally {
            setIsDeleting(false);
        }
    }, [activeAnalysis?.analysis_id, refetch]);

    return {
        allAnalyses,
        loading,
        error,
        refetch,
        activeAnalysisIndex,
        activeAnalysis,
        setActiveAnalysisIndex,
        syncActiveAnalysisIndex,
        isDeleting,
        deleteActiveAnalysis,
    };
}
