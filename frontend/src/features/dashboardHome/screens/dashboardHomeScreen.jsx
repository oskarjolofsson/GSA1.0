import PrimaryActionCard from "../../issues/components/primaryActionCard.jsx";
import SecondaryActionCard from "../../issues/components/secondaryActionCard.jsx";
import DemoPreview from "../../upload/components/SimpleUploadCard.jsx";

export default function DashboardHomeScreen() {

    return (
        <div className="justify-center p-10">
            <div className="text-3xl font-bold mb-6 text-white ml-6">Jump Back In</div>

            <PrimaryActionCard />

            {/* Recent issues */}
            <div className="text-xl font-bold mb-5 mt-10 text-white/60 ml-6">Recent Issues</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {/* Example Issue Cards */}
                <SecondaryActionCard />
                <SecondaryActionCard />
                <SecondaryActionCard />
            </div>

            {/* Upload */}
            <div className="text-3xl font-bold mb-6 mt-12 text-white/60 ml-6">Upload New Video</div>
            <div className="mt-12 mb-6">
                <DemoPreview />
            </div>

        </div>
    )
}