import PrimaryActionCard from "../../issues/components/primaryActionCard.jsx";
import SecondaryActionCard from "../../issues/components/secondaryActionCard.jsx";
import { useIssue } from "@/features/issues/hooks/useUserIssues.js";
import { ErrorState } from "@/shared/components/cards/error.js";
import { LoadingState } from "@/shared/components/cards/loading.js";

export default function DashboardHomeScreen() {
    const { issues, error, loading } = useIssue();

    if (error) {
        return (
            <div className="w-full h-full p-6 sm:p-8 flex items-center justify-center p-10 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 items-center justify-center p-4 border rounded-xl border-red-500/30">Error occurred while loading issues.</p>
            </div>
        );
    }

    

    if (loading) {
        return (
            <LoadingState title="Loading Issues" message="Fetching your issues..." />
        );
    }

    if (error) {
        return (
            <ErrorState
                title="Failed to Load Issues"
                error={new Error('Error occurred while loading issues.')}
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="justify-center p-10 text-center">
            <div className="text-3xl font-bold mb-6 text-white ml-6">Jump Back In</div>

            <PrimaryActionCard issue={issues[0]} />

            {/* Recent issues */}
            <div className="text-xl font-bold mb-5 mt-10 text-white/60 ml-6">Recent Issues</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {!loading && !error && issues.length === 0 && (
                    <p className="text-white/60">No recent issues found.</p>
                )}
                {!loading && !error && issues.slice(1, 4).map((issue) => (
                    <SecondaryActionCard key={issue.id} issue={issue} />
                ))}
            </div>
        </div>
    )
}