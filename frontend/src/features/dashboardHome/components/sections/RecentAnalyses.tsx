import { CheckCircle2, Clock3, XCircle, Sparkles } from "lucide-react";
import type { Analysis } from "@/features/analysis/types";
import GlassCard from "../GlassCard";
import { useNavigate } from "react-router-dom";

function formatAnalysisDate(createdAt: string) {
    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getStatusMeta(success: boolean | null) {
    if (success === true) {
        return {
            label: "Completed",
            icon: CheckCircle2,
            pillClass: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
            dotClass: "bg-emerald-300",
        };
    }

    if (success === false) {
        return {
            label: "Failed",
            icon: XCircle,
            pillClass: "border-rose-400/20 bg-rose-400/10 text-rose-200",
            dotClass: "bg-rose-300",
        };
    }

    return {
        label: "Pending",
        icon: Clock3,
        pillClass: "border-white/15 bg-white/[0.06] text-white/70",
        dotClass: "bg-white/45",
    };
}

export default function RecentAnalyses({ analyses }: { analyses: Analysis[] }) {
    const successfulCount = analyses.filter((analysis) => analysis.success === true).length;
    const navigate = useNavigate();

    return (
        <section className="mt-10 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/38">
                        Recent analyses
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        Analysis history
                    </h3>
                    <p className="mt-2 max-w-xl text-sm text-white/55 sm:text-base">
                        A simple overview of your latest swing uploads.
                    </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-sm text-white/70">
                    <Sparkles className="h-4 w-4" />
                    {successfulCount}/{analyses.length} completed successfully
                </div>
            </div>

            <GlassCard className="mt-6 overflow-hidden">
                <div className="divide-y divide-white/10">
                    {analyses.length === 0 ? (
                        <div className="px-6 py-8 text-sm text-white/55">
                            No analyses yet.
                        </div>
                    ) : (
                        analyses.map((analysis) => {
                            const status = getStatusMeta(analysis.success);
                            const Icon = status.icon;

                            return (
                                <div
                                    key={analysis.analysis_id}
                                    className="flex items-center justify-between gap-4 px-6 py-5 transition duration-200 hover:bg-white/[0.03] hover:cursor-pointer"
                                    onClick={() => navigate("/dashboard/analysis?analysisId=" + analysis.analysis_id)}
                                >
                                    <div className="min-w-0">
                                        <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">
                                            Analysis
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-white sm:text-[15px]">
                                            {formatAnalysisDate(analysis.created_at)}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/15 bg-white/[0.04] shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                                            {analysis.thumbnail_url ? (
                                                <img
                                                    src={analysis.thumbnail_url}
                                                    alt="Analysis thumbnail"
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_55%)] text-[10px] uppercase tracking-[0.2em] text-white/35">
                                                    N/A
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${status.pillClass}`}
                                        >
                                            <span className={`h-2 w-2 rounded-full ${status.dotClass}`} />
                                            <Icon className="h-4 w-4" />
                                            {status.label}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </GlassCard>
        </section>
    );
}