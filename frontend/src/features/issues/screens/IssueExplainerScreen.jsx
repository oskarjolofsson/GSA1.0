

import { Eye, AlertCircle, CheckCircle } from "lucide-react";
import ImagePlaceHolder from "../components/imagePlaceHolder.jsx";
import MainText from "../components/MainText.jsx";
import DetailCard from "../components/DetailCard.jsx";
import CTAButton from "../components/CTAButton.jsx";

export default function IssueExplainerScreen() {
    const explainerCards = [
        {
            icon: Eye,
            title: "What's happening?",
            description: "Description of the current issue detected in the swing.",
        },
        {
            icon: AlertCircle,
            title: "Why this causes problems",
            description: "Explanation of how this issue affects performance.",
        },
        {
            icon: CheckCircle,
            title: "What should happen",
            description: "Guidance on the correct technique to resolve the issue.",
        },
    ];

    const colors = [
        "from-red-500/10 to-red-500/5 border-red-500/20",
        "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20",
        "from-green-500/10 to-green-500/5 border-green-500/20",
    ];

    return (
        <div className="w-full h-full p-6 sm:p-8">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                <ImagePlaceHolder />
                <MainText />
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {explainerCards.map((card, index) => (
                    <DetailCard
                        key={index}
                        icon={card.icon}
                        title={card.title}
                        description={card.description}
                        colorClass={colors[index]}
                    />
                ))}
            </div>

            {/* CTA Button */}
            <CTAButton />
        </div>
    );
}