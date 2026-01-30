// React imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Components
import ResultBox from "../components/ResultBox.jsx";
import SharePopup from "../../../shared/components/popup/SharePopup.jsx";
import ShareButton from "../components/ShareButton.jsx";
import useAnalyses  from "../hooks/useAnalyses.js";
import useVideoURL from "../hooks/useVideoURL.js";
import TextBox from "../../../shared/components/cards/textBox.jsx";

export default function AnalysisScreen() {
    const navigate = useNavigate();
    const { activeAnalysis, loading, error } = useAnalyses();
    const [activeAnalysisState, setActiveAnalysisState] = useState(null);
    // const [showSharePopup, setShowSharePopup] = useState(false);
    const [activeProblem, setActiveProblem] = useState(0);

    const videoURL = useVideoURL(activeAnalysisState) ? activeAnalysisState : null;

    // const share_button_url = window.location.origin + "/share_analysis/" + (activeAnalysis ? activeAnalysis.analysis_id : "");

    useEffect(() => {
        if (activeAnalysis) {
            if (activeAnalysis.length > 0 && !activeAnalysisState) {
                const firstAnalysis = activeAnalysis[0];
                setActiveAnalysisState(firstAnalysis);
            }
        }
    }, [activeAnalysis]);

    return (
        <div className="w-full mx-auto px-4 py-6">
            {loading ? (
                <p className="text-center text-gray-500">Loading analyses...</p>
            ) : error ? (
                <p className="text-center text-red-500">Error: {error}</p>
            ) : activeAnalysisState ? (
                <>
                    <ShareButton onClick={() => setShowSharePopup(true)} />
                    <ResultBox 
                        analysis={activeAnalysisState.analysis_results} 
                        video_url={videoURL}
                        activeProblem={activeProblem}
                        setActiveProblem={setActiveProblem}
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
