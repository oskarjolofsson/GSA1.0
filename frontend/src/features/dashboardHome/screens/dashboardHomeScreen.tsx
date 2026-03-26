import { useState } from "react";
import PrimaryActionCard from "../../issues/components/primaryActionCard.jsx";
import SecondaryActionCard from "../../issues/components/secondaryActionCard.jsx";
import { useIssue } from "@/features/issues/hooks/useUserIssues.js";
import { ErrorState } from "@/shared/components/cards/error.js";
import { LoadingState } from "@/shared/components/cards/loading.js";
import ConfirmationPopup from "@/shared/components/popup/ConfirmationPopup.jsx";
import issueService from "@/features/issues/services/issueService.js";

export default function DashboardHomeScreen() {
    const { issues, error, loading, refreshIssues } = useIssue();
    const [confirmPopup, setConfirmPopup] = useState<{ isOpen: boolean; AnalysisIssueId: string | null }>({
        isOpen: false,
        AnalysisIssueId: null,
    });

    if (loading) {
        return (
            <LoadingState title="Loading Issues" message="Fetching your issues..." />
        );
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load Issues"
                error={new Error('Error occurred while loading the home dashboard page.')}
                onRetry={() => window.location.reload()}
            />
        );
    }

    const handleDeleteClick = (AnalysisIssueId: string) => {
        setConfirmPopup({
            isOpen: true,
            AnalysisIssueId: AnalysisIssueId,
        });
    };

    const handleConfirmDelete = async () => {
        if (!confirmPopup.AnalysisIssueId) return;

        try {
            await issueService.markIssueAsDone(confirmPopup.AnalysisIssueId);
            await refreshIssues();
            setConfirmPopup({ isOpen: false, AnalysisIssueId: null });
        } catch (err) {
            console.error("Error deleting issue:", err);
        }
    };

    return (
        <div className="justify-center p-10 text-center">
            <div className="text-3xl font-bold mb-6 text-white ml-6">Jump Back In</div>

            <PrimaryActionCard issue={issues[0]} onDeleteIssue={handleDeleteClick} />

            {/* Recent issues */}
            <div className="text-xl font-bold mb-5 mt-10 text-white/60 ml-6">Recent Issues</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {!loading && !error && issues.length === 0 && (
                    <p className="text-white/60">No recent issues found.</p>
                )}
                {!loading && !error && issues.slice(1, 4).map((issue) => (
                    <SecondaryActionCard key={issue.id} issue={issue} onDeleteIssue={handleDeleteClick} />
                ))}
            </div>

            {/* Delete Confirmation Popup */}
            <ConfirmationPopup
                isOpen={confirmPopup.isOpen}
                text="Are you sure you want to remove this issue?"
                onClose={() => setConfirmPopup({ isOpen: false, AnalysisIssueId: null })}
                onConfirm={handleConfirmDelete}
            />
        </div>
    )
}