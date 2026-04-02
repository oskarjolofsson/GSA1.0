import { useState, useEffect } from 'react';
import analysisService from '../services/analysisService';
import issueService from '../../issues/services/issueService';
import type { Analysis, AnalysisWithIssues } from '../types';
import type { Issue } from '../../issues/types';

interface UseAnalysesReturn {
    allAnalyses: Analysis[];
    activeAnalysis: AnalysisWithIssues | null;
    setActiveAnalysisById: (analysisId: string) => Promise<void>;
    loading: boolean;
    error: string | null;
    deleteActiveAnalysis: () => Promise<void>;
}

export type { UseAnalysesReturn };

/**
 * Custom hook to fetch and manage analyses for the user
 * Fetches analysis metadata and associated issues
 */
export default function useAnalyses(): UseAnalysesReturn {
    const [allAnalyses, setAllAnalyses] = useState<Analysis[]>([]);
    const [activeAnalysis, setActiveAnalysis] = useState<AnalysisWithIssues | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
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

                // 3. Resolve active analysis ID
                const urlParams = new URLSearchParams(window.location.search);
                const analysisIdFromUrl = urlParams.get('analysisId');

                const resolvedAnalysisId =
                    analysisIdFromUrl ??
                    fetched[0]?.analysis_id ??
                    null;

                // 4. Fetch active analysis with issues
                if (resolvedAnalysisId) {
                    await loadAnalysisWithIssues(resolvedAnalysisId);
                } else {
                    setActiveAnalysis(null);
                }
            } catch (err) {
                console.error('Error fetching analyses:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch analyses');
                setActiveAnalysis(null);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    /**
     * Load analysis and fetch its associated issues
     */
    const loadAnalysisWithIssues = async (analysisId: string): Promise<void> => {
        try {
            // Fetch analysis metadata
            const analysisData = await analysisService.getAnalysisById(analysisId);

            // Fetch issues for this analysis
            let issues: Issue[] = [];
            let analysisIssues: any[] = [];
            
            try {
                // Try to fetch from the analysis-issues endpoint
                analysisIssues = await analysisService.getAnalysisIssues(analysisId);
                
                // Fetch full issue details
                issues = await issueService.getIssuesByAnalysis(analysisId);
                
                // Merge confidence scores from AnalysisIssue into Issues
                const issuesWithConfidence = issues.map(issue => {
                    const analysisIssue = analysisIssues.find(ai => ai.issue_id === issue.id);
                    return {
                        ...issue,
                        confidence: analysisIssue?.confidence
                    };
                });

                // Combine analysis with issues
                const combined: AnalysisWithIssues = {
                    ...analysisData,
                    issues: issuesWithConfidence
                };

                setActiveAnalysis(combined);
            } catch (issueErr) {
                // If issues fetch fails, still show the analysis
                console.error('Error fetching issues:', issueErr);
                setActiveAnalysis({
                    ...analysisData,
                    issues: []
                });
            }
        } catch (err) {
            console.error('Error loading analysis:', err);
            throw err;
        }
    };

    /**
     * Method to switch active analysis by ID
     */
    const setActiveAnalysisById = async (analysisId: string): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            
            await loadAnalysisWithIssues(analysisId);
        } catch (err) {
            console.error('Error setting active analysis:', err);
            setError(err instanceof Error ? err.message : 'Failed to load analysis');
        } finally {
            setLoading(false);
        }
    };

    const deleteActiveAnalysis = async (): Promise<void> => {
        if (!activeAnalysis) return;
        try {
            await analysisService.deleteAnalysis(activeAnalysis.analysis_id);
            // Refresh the list of analyses after deletion
            const updatedAnalyses = await analysisService.getAnalysesForUser();
            setAllAnalyses(updatedAnalyses);
            setActiveAnalysis(null);
        } catch (err) {
            console.error('Error deleting analysis:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete analysis');
        }
    };

    return {
        allAnalyses,
        activeAnalysis,
        setActiveAnalysisById,
        loading,
        error,
        deleteActiveAnalysis
    };
}