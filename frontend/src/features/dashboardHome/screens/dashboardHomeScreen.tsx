import PrimaryActionCard from "../../issues/components/primaryActionCard.jsx";
import SecondaryActionCard from "../../issues/components/secondaryActionCard.jsx";
import DemoPreview from "../../upload/components/SimpleUploadCard.jsx";
import { useIssue } from "@/features/issues/hooks/useIssue";

export default function DashboardHomeScreen() {
    const { issues, loading, error } = useIssue();

    if (error) {
        return (
            <div className="w-full h-full p-6 sm:p-8 flex items-center justify-center p-10 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-500 items-center justify-center p-4 border rounded-xl border-red-500/30">Error occurred while loading issues.</p>
            </div>
        );
    }

    return (
        <div className="justify-center p-10">
            <div className="text-3xl font-bold mb-6 text-white ml-6">Jump Back In</div>

            {loading && <p className="text-white/60">Loading issues...</p>}
            {!loading && !error && issues.length > 0 && (
                <PrimaryActionCard issue={issues[0]} />
            )}
            {!loading && !error && issues.length === 0 && (
                <p className="text-white/60">No primary issue found.</p>
            )}

            {/* Recent issues */}
            <div className="text-xl font-bold mb-5 mt-10 text-white/60 ml-6">Recent Issues</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {loading && <p className="text-white/60">Loading issues...</p>}
                {error && <p className="text-red-500">Error occurred while loading issues.</p>}
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