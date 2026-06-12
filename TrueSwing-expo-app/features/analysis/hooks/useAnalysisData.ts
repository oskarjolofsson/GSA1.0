import { useState, useEffect } from "react";
import useVideoURL from "./useVideoURL";
import type { Analysis, AnalysisWithIssues } from "../types";
import type { Issue } from "features/issues/types";
import analysisService from "../services/analysisService";
import issueService from "features/issues/services/issueService";

interface UseAnalysisDataReturn {
    analysis: AnalysisWithIssues | null;
    issue: (Issue & { confidence?: number }) | null;
    activeIssue: number;
    setActiveIssue: (index: number) => void;
    issues: (Issue & { confidence?: number })[];
    totalIssues: number;
    videoURL: string | null;
    analysisError: string | null;
    loading: boolean;
}

/**
 * Custom hook to fetch and manage analysis details (issues, video string, etc.)
 */
export default function useAnalysisData(initialAnalysis: Analysis | null): UseAnalysisDataReturn {
    const [analysis, setAnalysis] = useState<AnalysisWithIssues | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeIssue, setActiveIssue] = useState<number>(0);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // Call hook at top level, not inside useEffect
    const videoURL = useVideoURL(initialAnalysis);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            setAnalysisError(null);

            if (!initialAnalysis) {
                setAnalysis(null);
                setLoading(false);
                return;
            }
            
            try {
                // Fetch issues for this analysis
                let issues: Issue[] = [];
                let analysisIssues: any[] = [];
                
                try {
                    analysisIssues = await analysisService.getAnalysisIssues(initialAnalysis.analysis_id);
                    issues = await issueService.getIssuesByAnalysis(initialAnalysis.analysis_id);
                    
                    const issuesWithConfidence = issues.map(issue => {
                        const analysisIssue = analysisIssues.find(ai => ai.issue_id === issue.id);
                        return {
                            ...issue,
                            confidence: analysisIssue?.confidence
                        };
                    });

                    setAnalysis({
                        ...initialAnalysis,
                        issues: issuesWithConfidence
                    });
                } catch (issueErr) {
                    console.error('Error fetching issues in useAnalysisData:', issueErr);
                    setAnalysis({
                        ...initialAnalysis,
                        issues: []
                    });
                }
            } catch (err: any) {
                console.error("Error setting up active analysis:", err);
                setAnalysisError(err.message || "Failed to fetch analysis details");
            } finally {
                setLoading(false);
            }
        };

        if (initialAnalysis?.analysis_id) {
            fetchDetails();
        } else {
            setAnalysis(null);
            setLoading(false);
        }
    }, [initialAnalysis?.analysis_id]);

    const sortedIssues = analysis?.issues
        ? [...analysis.issues].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        : [];

    // Current issue with confidence from analysis
    const [issue, setIssue] = useState<(Issue & { confidence?: number }) | null>(null);

    useEffect(() => {
        // Check if analysis failed
        if (analysis?.success === false) {
            setAnalysisError(analysis.error_message || "Analysis failed");
            setIssue(null);
            return;
        }
        
        // Clear error if analysis is successful
        if (!loading) {
            setAnalysisError(null);
        }
        
        if (sortedIssues.length > 0 && activeIssue >= 0 && activeIssue < sortedIssues.length) {
            setIssue(sortedIssues[activeIssue]);
        } else {
            setIssue(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analysis, activeIssue, loading]);

    return {
        analysis,
        issue,
        issues: sortedIssues,
        activeIssue,
        setActiveIssue,
        totalIssues: sortedIssues.length,
        videoURL,
        analysisError,
        loading
    };
}
