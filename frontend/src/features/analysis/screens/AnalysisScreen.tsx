// React imports
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SessionHeader from "../../../shared/components/sessionHeader.jsx";

// Components
import ResultBox from "../components/ResultBox";
import SharePopup from "../../../shared/components/popup/SharePopup.jsx";
import TextBox from "../../../shared/components/cards/textBox.jsx";
import AnalysisSidebar from "../components/AnalysisSidebar";
import FeedbackBubble from "../../feedback/components/FeedbackBubble.jsx";
import FeedbackPopup from "../../feedback/components/FeedbackPopup.jsx";
import ConfirmationPopup from "../../../shared/components/popup/ConfirmationPopup.jsx";
import { LoadingState } from "@/shared/components/cards/loading.js";
import { ErrorState } from "@/shared/components/cards/error.js";

// Custom hooks
import useAnalyses from "../hooks/useAnalyses";
import useAnalysisData from "../hooks/useAnalysisData";
import type { UseAnalysesReturn } from "../hooks/useAnalyses";
import { useAuth } from "@/features/auth/hooks/useAuth"

export default function AnalysisScreen() {
    const navigate = useNavigate();
    const { setAnalysis, issue, activeIssue, setActiveIssue, totalIssues, videoURL, analysisError } = useAnalysisData();    // The analysis data for current analysis 
    const { activeAnalysis, allAnalyses, setActiveAnalysisById, loading, error, deleteActiveAnalysis }: UseAnalysesReturn = useAnalyses();        // All analyses for the user and related functions, limited info
    const [showFeedbackPopup, setShowFeedbackPopup] = useState<boolean>(false);
    const [showSharePopup, setShowSharePopup] = useState<boolean>(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const share_button_url = window.location.origin + "/dashboard/analysis?analysisId=" + (activeAnalysis ? activeAnalysis.analysis_id : "");
    const { user } = useAuth();

    useEffect(() => {
        setAnalysis(activeAnalysis);
    }, [activeAnalysis, setAnalysis]);

    // Handle switching analyses from sidebar
    const handleSelectAnalysis = async (analysisId: string): Promise<void> => {
        await setActiveAnalysisById(analysisId);
        setActiveIssue(0); // Reset to first issue
    };

    const handleDeleteAnalysis = () => {
        if ( activeAnalysis && activeAnalysis?.user_id === user?.id && activeAnalysis?.status === "completed") {
            return () => setShowDeleteConfirm(true);
        }
        return undefined;
    }

    const confirmDelete = async () => {
        try {
            await deleteActiveAnalysis();
            navigate("/dashboard/analysis");
            document.location.reload();
        } catch (err) {
            console.error("Error deleting analysis:", err);
        }
    }

    if (error) {
        return (
            <ErrorState title="Could not load analyses" error={error} onRetry={() => window.location.reload()} />
        );
    }

    return (
        <>
            <SessionHeader onShareClick={() => setShowSharePopup(true)} showShare={!!activeAnalysis} onDeleteClick={handleDeleteAnalysis()} />
            <div className="w-full mx-auto md:px-4 md:py-6 h-full items-center justify-center">
                {loading ? (
                    <LoadingState title="Loading Analysis"/>
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
                    <div>
                        <ResultBox
                            analysis={activeAnalysis}
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

                        {totalIssues === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <TextBox
                                    header={"No issues detected in your swing"}
                                    text={"Great job! Your swing looks solid. Do you want to delete this analysis now?"}
                                    ctaOnClick={() => setShowDeleteConfirm(true)}
                                    ctaText={"Delete Analysis"}
                                    redCTA={true}
                                />
                            </div>
                        )}

                    </div>
                ) : (
                    <TextBox 
                        header={"You have no analyses made yet"} 
                        text={"Upload a video to get your first swing analysis"}
                        ctaOnClick={() => navigate("/dashboard/upload")} 
                        ctaText={"Create Analysis"} 
                    />
                )

                }

                {showSharePopup && (
                    <SharePopup
                        shareUrl={share_button_url}
                        onClose={() => setShowSharePopup(false)}
                    />
                )}

                {/* Feedback Feature */}
                <FeedbackBubble onOpenFeedback={() => setShowFeedbackPopup(true)} />
                <FeedbackPopup
                    isOpen={showFeedbackPopup}
                    onClose={() => setShowFeedbackPopup(false)}
                />

                {/* Delete Confirmation Popup */}
                <ConfirmationPopup
                    isOpen={showDeleteConfirm}
                    text="Are you sure you want to delete this analysis? This action cannot be undone."
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={confirmDelete}
                />
            </div>
        </>
    );
}
