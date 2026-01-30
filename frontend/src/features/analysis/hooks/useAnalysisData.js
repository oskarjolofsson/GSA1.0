import { useState, useEffect } from "react";
import useVideoURL from "./useVideoURL";

// Custom hook to manage analysis data and current issue
export default function useAnalysisData() {

    const [analysis, setAnalysis] = useState(null);
    const [activeIssue, setActiveIssue] = useState(0);

    // Call hook at top level, not inside useEffect
    const videoURL = useVideoURL(analysis);

    // properties of each issue
    const [issue, setIssue] = useState({
        title: "",
        phase: "",
        priority: 1,
        shot_effect: "",
        technical_effect: "",
        what_is_happening: "",
        what_should_happen: "",
        drill: null,
        certainty: ""
    });


    useEffect(() => {
        const issues = analysis?.analysis_results?.issues;
        
        if (issues && issues.length > 0) {
            const issueData = issues[activeIssue];
            setIssue({
                title: issueData.title || "",
                phase: issueData.phase || "",
                priority: issueData.priority || 1,
                shot_effect: issueData.shot_effect || "",
                technical_effect: issueData.technical_effect || "",
                what_is_happening: issueData.what_is_happening || "",
                what_should_happen: issueData.what_should_happen || "",
                drill: issueData.drill || null,
                certainty: issueData.certainty || ""
            });
        } 
    }, [analysis, activeIssue]);

    return {
        setAnalysis,
        issue,
        activeIssue,
        setActiveIssue,
        totalIssues: analysis?.analysis_results?.issues?.length || 0,
        videoURL  
    }

}