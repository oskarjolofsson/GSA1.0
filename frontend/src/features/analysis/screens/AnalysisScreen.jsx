// React imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Components
import ResultBox from "../components/ResultBox.jsx";
import SharePopup from "../../../shared/components/popup/SharePopup.jsx";
import ShareButton from "../components/ShareButton.jsx";
import TextBox from "../../../shared/components/cards/textBox.jsx";

// Custom hooks
import useAnalyses  from "../hooks/useAnalyses.js";         
import useAnalysisData from "../hooks/useAnalysisData.js";

export default function AnalysisScreen() {
    const navigate = useNavigate();
    const { setAnalysis, issue, activeIssue, setActiveIssue, totalIssues, videoURL } = useAnalysisData();

    const { activeAnalysis, allAnalyses, loading, error } = useAnalyses();

    // const [showSharePopup, setShowSharePopup] = useState(false);
    // const share_button_url = window.location.origin + "/share_analysis/" + (activeAnalysis ? activeAnalysis.analysis_id : "");

    useEffect(() => {
        setAnalysis(activeAnalysis);
    }, [activeAnalysis]);

    return (
        <div className="w-full mx-auto px-4 py-6 h-full items-center justify-center">
            {loading ? (
                <p className="text-center text-gray-500">Loading analyses...</p>
            ) : error ? (
                <p className="text-center text-red-500">Error: {error}</p>
            ) : activeAnalysis ? (
                <>
                    {/* <ShareButton onClick={() => setShowSharePopup(true)} /> */}
                    <ResultBox 
                        analysis={activeAnalysis.analysis_results} 
                        issue={issue}
                        totalIssues={totalIssues}
                        video_url={videoURL}
                        activeProblem={activeIssue}
                        setActiveProblem={setActiveIssue}
                    />
                </>
            ) : (
                <TextBox header={"You have no analysises made yet"} ctaOnClick={() => navigate("/dashboard/upload")} ctaText={"Create Analysis"} />
            )
            
            }

            {/* {showSharePopup && (
                <SharePopup
                    shareUrl={share_button_url}
                    onClose={() => setShowSharePopup(false)}
                />
            )} */}
        </div>
    );
}
