import PrimaryActionCard from "../../issues/components/primaryActionCard.jsx";
import SecondaryActionCard from "../../issues/components/secondaryActionCard.jsx";
import DemoPreview from "../../upload/components/SimpleUploadCard.jsx";
import { useIssue } from "@/features/issues/hooks/useIssue";

export default function DashboardHomeScreen() {
    const { issues, loading, error } = useIssue();
    console.log("Issues in DashboardHomeScreen:", issues, loading, error);

    return (
        <div className="justify-center p-10">
            <div className="text-3xl font-bold mb-6 text-white ml-6">Jump Back In</div>

            <PrimaryActionCard issue={issues[0]} />

            {/* Recent issues */}
            <div className="text-xl font-bold mb-5 mt-10 text-white/60 ml-6">Recent Issues</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {loading && <p className="text-white/60">Loading issues...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && !error && issues.length === 0 && (
                    <p className="text-white/60">No recent issues found.</p>
                )}
                {!loading && !error && issues.slice(1,4).map((issue) => (
                    <SecondaryActionCard key={issue.id} issue={issue} />
                ))}
            </div>

            {/* Upload */}
            {/* <div className="text-3xl font-bold mb-6 mt-12 text-white/60 ml-6">Upload New Video</div>
            <div className="mt-12 mb-6">
                <DemoPreview />
            </div> */}

        </div>
    )
}