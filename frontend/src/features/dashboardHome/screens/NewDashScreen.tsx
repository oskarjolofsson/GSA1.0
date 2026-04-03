import { useState } from "react";
import { useNavigate } from "react-router-dom";

import RecentAnalyses from "../components/sections/RecentAnalyses";
import IssueProgress from "../components/sections/IssueProgress";
import Hero from "../components/sections/Hero";
import Header from "../components/sections/Header";
import type { Issue } from "@/features/issues/types";
import { useIssue } from "@/features/issues/hooks/useUserIssues";
import { ErrorState } from "@/shared/components/cards/error";
import { LoadingState } from "@/shared/components/cards/loading";
import TextBox  from "@/shared/components/cards/textBox";
import useAnalyses from "@/features/analysis/hooks/useAnalyses";


export default function PremiumGolfDashboard() {
    const navigate = useNavigate();

    const { issues, error, loading, refreshIssues } = useIssue();
    const { allAnalyses } = useAnalyses();

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

    if (issues.length === 0) {
            return (
                <TextBox
                    header={"Welcome to TrueSwing! 👋"} 
                    text={"Upload a swing video. Get better. It’s that simple!"}
                    ctaOnClick={() => navigate("/dashboard/upload")} 
                    ctaText={"Create Analysis"} 
                />
            )
        }

    return (
        <div className="min-h-screen overflow-hidden  text-white pb-20">
            <div className="pointer-events-none absolute inset-0">
            </div>

            <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                <div className="min-h-[91vh] flex flex-col justify-center pt-10">
                    <Header />

                    <Hero issue={issues[0]} />
                </div>

                <IssueProgress issues={issues.slice(1)} />

                <RecentAnalyses analyses={allAnalyses} />

            </main>
        </div>
    );
}
