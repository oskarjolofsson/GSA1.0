import { useState, useEffect, useCallback } from 'react';
import analysisService from '../services/analysisService';
import issueService from 'features/issues/services/issueService';
import type { Analysis, AnalysisWithIssues } from '../types';
import type { Issue } from 'features/issues/types';

interface UseAnalysesReturn {
    allAnalyses: Analysis[];
    loading: boolean;
    error: string | null;
    deleteActiveAnalysis: (analysisId: string) => Promise<void>;
    refetch: () => Promise<void>;
}

export type { UseAnalysesReturn };

/**
 * Custom hook to fetch and manage analyses for the user
 * Fetches analysis metadata and associated issues
 */
export default function useAnalyses(): UseAnalysesReturn {
    const [allAnalyses, setAllAnalyses] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 1. Fetch list of analyses
            const fetched = await analysisService.getAnalysesForUser();

            // 2. Sort newest first
            fetched.sort((a, b) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return dateB - dateA;
            });

            setAllAnalyses(fetched);

        } catch (err) {
            console.error('Error fetching analyses:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch analyses');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const deleteActiveAnalysis = useCallback(async (analysis_id: string): Promise<void> => {
        try {
            await analysisService.deleteAnalysis(analysis_id);
            // Refresh the list of analyses after deletion
            const updatedAnalyses = await analysisService.getAnalysesForUser();
            setAllAnalyses(updatedAnalyses);
        } catch (err) {
            console.error('Error deleting analysis:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete analysis');
        }
    }, []);

    return {
        allAnalyses,
        loading,
        error,
        deleteActiveAnalysis,
        refetch,
    };
}