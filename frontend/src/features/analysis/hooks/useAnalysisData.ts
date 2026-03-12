import { useState, useEffect } from "react";
import useVideoURL from "./useVideoURL";
import type { AnalysisWithIssues } from "../types";
import type { Issue } from "../../issues/types";

interface UseAnalysisDataReturn {
    setAnalysis: (analysis: AnalysisWithIssues | null) => void;
    issue: (Issue & { confidence?: number }) | null;
    activeIssue: number;
    setActiveIssue: (index: number) => void;
    totalIssues: number;
    videoURL: string | null;
    analysisError: string | null;
}

/**
 * Custom hook to manage analysis data and current issue
 * Transforms backend Issue data to frontend display format
 */
export default function useAnalysisData(): UseAnalysisDataReturn {
    const [analysis, setAnalysis] = useState<AnalysisWithIssues | null>(null);
    const [activeIssue, setActiveIssue] = useState<number>(0);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // Call hook at top level, not inside useEffect
    const videoURL = useVideoURL(analysis);

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
        setAnalysisError(null);
        
        const issues = analysis?.issues;
        
        if (issues && issues.length > 0 && activeIssue < issues.length) {
            const issueData = issues[activeIssue];
            setIssue(issueData);
        } else {
            setIssue(null);
        }
    }, [analysis, activeIssue]);

    return {
        setAnalysis,
        issue,
        activeIssue,
        setActiveIssue,
        totalIssues: analysis?.issues?.length || 0,
        videoURL,
        analysisError
    };
}
