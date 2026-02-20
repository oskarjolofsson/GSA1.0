import { useState, useEffect } from "react";
import useVideoURL from "./useVideoURL";
import type { AnalysisWithIssues, IssueDisplay } from "../types";

interface UseAnalysisDataReturn {
    setAnalysis: (analysis: AnalysisWithIssues | null) => void;
    issue: IssueDisplay | null;
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

    // Default issue display object
    const [issue, setIssue] = useState<IssueDisplay | null>(null);

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
            
            // Transform backend Issue to frontend IssueDisplay format
            setIssue({
                title: issueData.title || "",
                phase: issueData.phase || "",
                priority: activeIssue + 1, // Priority based on order
                shot_effect: issueData.shot_outcome || "",
                technical_effect: issueData.swing_effect || "",
                what_is_happening: issueData.current_motion || "",
                what_should_happen: issueData.expected_motion || "",
                drill: null, // Will be implemented later
                certainty: issueData.confidence ? `${Math.round(issueData.confidence * 100)}%` : "Unknown"
            });
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
