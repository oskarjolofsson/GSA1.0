// React imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Components
import ResultBox from "../components/ResultBox.jsx";
import SharePopup from "../../../shared/components/popup/SharePopup.jsx";
import ShareButton from "../components/ShareButton.jsx";
import TextBox from "../../../shared/components/cards/textBox.jsx";
import AnalysisSidebar from "../components/AnalysisSidebar.jsx";

// Custom hooks
import useAnalyses  from "../hooks/useAnalyses.js";         
import useAnalysisData from "../hooks/useAnalysisData.js";

export default function AnalysisScreen() {
    const navigate = useNavigate();
    const { setAnalysis, issue, activeIssue, setActiveIssue, totalIssues, videoURL, analysisError } = useAnalysisData();

    const { activeAnalysis, allAnalyses, setActiveAnalysisById, loading, error } = useAnalyses();

    // const [showSharePopup, setShowSharePopup] = useState(false);
    // const share_button_url = window.location.origin + "/share_analysis/" + (activeAnalysis ? activeAnalysis.analysis_id : "");

    useEffect(() => {
        setAnalysis(activeAnalysis);
    }, [activeAnalysis, setAnalysis]);

    // Handle switching analyses from sidebar
    const handleSelectAnalysis = async (analysisId) => {
        await setActiveAnalysisById(analysisId);
        setActiveIssue(0); // Reset to first issue
    };

    return (
        <div className="w-full mx-auto px-4 py-6 h-full items-center justify-center">
            {loading ? (
                <p className="text-center text-gray-500">Loading analyses...</p>
            ) : error ? (
                <p className="text-center text-red-500">Error: {error}</p>
            ) : analysisError ? (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="glass-container p-8 rounded-xl max-w-md text-center">
                        <p className="text-red-400 text-lg font-medium mb-4">{analysisError}</p>
                        <button
                            onClick={() => navigate("/dashboard/upload")}
                            className="px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
                        >
                            Upload New Video
                        </button>
                    </div>
                </div>
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
                    
                    {/* Sidebar for switching analyses */}
                    <AnalysisSidebar
                        allAnalyses={allAnalyses}
                        activeAnalysis={activeAnalysis}
                        onSelectAnalysis={handleSelectAnalysis}
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
