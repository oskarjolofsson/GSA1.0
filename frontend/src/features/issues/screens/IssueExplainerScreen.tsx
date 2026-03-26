import { Eye, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import ImagePlaceHolder from "../components/ImagePlaceHolder";
import MainText from "../components/MainText";
import DetailCard from "../components/DetailCard";
import CTAButton from "../components/CTAButton";
import IssuesSidebar from "../components/IssuesSidebar";
import ConfirmationPopup from "@/shared/components/popup/ConfirmationPopup";
import type { Issue } from "@/features/issues/types";
import { useIssue } from "@/features/issues/hooks/useUserIssues";
import issueService from "../services/issueService";
import { useNavigate } from "react-router";

const DETAIL_CARD_COLORS = [
    "from-red-500/10 to-red-500/5 border-red-500/20",
    "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20",
    "from-green-500/10 to-green-500/5 border-green-500/20",
] as const;

const getExplainerCards = (issue: Issue) => [
    {
        icon: Eye,
        title: "What's happening?",
        description: issue.current_motion,
    },
    {
        icon: AlertCircle,
        title: "Why this causes problems",
        description: issue.swing_effect,
    },
    {
        icon: CheckCircle,
        title: "What should happen",
        description: issue.expected_motion,
    },
];

export default function IssueExplainerScreen() {
    const { loading, error, activeIssue, issues, selectIssue, refreshIssues } = useIssue();
    const navigate = useNavigate();
    const [confirmPopup, setConfirmPopup] = useState<{ isOpen: boolean; issueId: string | null }>({
        isOpen: false,
        issueId: null,
    });

    if (loading) {
        return (
            <div className="w-full h-full p-6 sm:p-8">
                <p className="text-white/60">Loading issue details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full p-6 sm:p-8 flex items-center justify-center p-10 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 items-center justify-center p-4 border rounded-xl border-red-500/30">Could not load issue details.</p>
            </div>
        );
    }

    if (!activeIssue) {
        return (
            <div className="w-full h-full p-6 sm:p-8">
                <p className="text-white/60">No active issue found.</p>
            </div>
        );
    }

    const explainerCards = getExplainerCards(activeIssue);

    const handleDeleteClick = (analysisIssueId: string) => {
        setConfirmPopup({
            isOpen: true,
            issueId: analysisIssueId,
        });
    };

    const handleConfirmDelete = async () => {
        if (!confirmPopup.issueId) return;

        try {
            await issueService.markIssueAsDone(confirmPopup.issueId);
            console.log("Marking issue as done with analysis_issue_id:", confirmPopup.issueId);
            await refreshIssues();
            setConfirmPopup({ isOpen: false, issueId: null });
        } catch (err) {
            console.error("Error deleting issue:", err);
        }
    };

    return (
        <>
            <div className="w-full h-full p-6 sm:p-8">
                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                    <ImagePlaceHolder />
                    <MainText 
                        title={activeIssue.title} 
                        description={activeIssue.shot_outcome} 
                    />
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {explainerCards.map((card, index) => (
                        <DetailCard
                            key={card.title}
                            icon={card.icon}
                            title={card.title}
                            description={card.description}
                            colorClass={DETAIL_CARD_COLORS[index]}
                        />
                    ))}
                </div>

                {/* CTA Button */}
                <CTAButton onClick={() => {navigate(`/dashboard/drills/?issueId=${activeIssue.id}`)}} />
            </div>

            {/* Issues Sidebar */}
            <IssuesSidebar
                allIssues={issues}
                activeIssue={activeIssue}
                onSelectIssue={selectIssue}
                onDeleteIssue={handleDeleteClick}
            />

            {/* Delete Confirmation Popup */}
            <ConfirmationPopup
                isOpen={confirmPopup.isOpen}
                text="Are you sure you want to remove this issue? You can always add it back later."
                onClose={() => setConfirmPopup({ isOpen: false, issueId: null })}
                onConfirm={handleConfirmDelete}
            />
        </>
    );
}