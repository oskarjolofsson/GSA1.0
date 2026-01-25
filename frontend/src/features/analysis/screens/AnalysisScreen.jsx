import { useState, useEffect } from "react";
import ResultBox from "../components/ResultBox.jsx";
import SharePopup from "../../../shared/components/SharePopup.jsx";
import ShareButton from "../components/ShareButton.jsx";
import { useAnalyses } from "../hooks/useAnalyses.js";
import { useVideoURL } from "../hooks/useVideoURL.js";

export default function AnalysisScreen() {
    const { analyses, loading, error } = useAnalyses();
    const [activeAnalysis, setActiveAnalysis] = useState(null);
    const [showSharePopup, setShowSharePopup] = useState(false);
    const [activeProblem, setActiveProblem] = useState(0);

    const videoURL = useVideoURL(activeAnalysis);

    const share_button_url = window.location.origin + "/share_analysis/" + (activeAnalysis ? activeAnalysis.analysis_id : "");

    useEffect(() => {
        if (analyses.length > 0 && !activeAnalysis) {
            const firstAnalysis = analyses[0];
            console.log("Setting active analysis to:", firstAnalysis);
            setActiveAnalysis(firstAnalysis);
        }
    }, [analyses, activeAnalysis]);

    return (
        <div className="w-full mx-auto px-4 py-6">
            {activeAnalysis && (
                <>
                    <ShareButton onClick={() => setShowSharePopup(true)} />
                    <ResultBox 
                        analysis={activeAnalysis.analysis_results} 
                        video_url={videoURL}
                        activeProblem={activeProblem}
                        setActiveProblem={setActiveProblem}
                    />
                </>
            )}

            {showSharePopup && (
                <SharePopup
                    shareUrl={share_button_url}
                    onClose={() => setShowSharePopup(false)}
                />
            )}
        </div>
    );
}
