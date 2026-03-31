import { ArrowRight, CalendarDays } from "lucide-react";

import GlassCard from "../GlassCard";
import { cn } from "../../utils/cn";
import { getTrendMeta } from "../../utils/getTrendData";

const user = {
    name: "Alex",
    totalAnalyses: 24,
    activeIssues: 5,
    streak: 9,
    weeklySessions: 3,
};

const recentAnalyses = [
    {
        date: "Mar 28",
        label: "Range Session • 7 Iron",
        issues: 3,
        summary: "Early Extension is improving, but C-Posture remains the main limiter.",
    },
    {
        date: "Mar 25",
        label: "Putting Green • Putter",
        issues: 1,
        summary: "Your putting stroke is looking smooth, with a consistent low point.",
    },
    {
        date: "Mar 20",
        label: "Course Round • Driver",
        issues: 4,
        summary: "Loss of Posture and Over The Top are the main issues, likely causing your push slices.",
    },
];

export default function RecentAnalyses() {
    return (
        <section className="mt-10 pb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/38">Recent analyses</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        Your latest swing feedback
                    </h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/60">
                    <CalendarDays className="h-4 w-4" />
                    {user.weeklySessions} sessions this week
                </div>
            </div>

            <GlassCard className="mt-5 overflow-hidden">
                <div className="hidden grid-cols-[120px_1.2fr_120px_1.6fr_150px] gap-4 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.22em] text-white/35 md:grid">
                    <span>Date</span>
                    <span>Session</span>
                    <span>Issues</span>
                    <span>Result summary</span>
                    <span>Action</span>
                </div>

                <div className="divide-y divide-white/10">
                    {recentAnalyses.map((item) => (
                        <div
                            key={`${item.date}-${item.label}`}
                            className="grid gap-4 px-5 py-5 transition duration-200 hover:bg-white/[0.03] md:grid-cols-[120px_1.2fr_120px_1.6fr_150px] md:items-center"
                        >
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-white/35 md:hidden">Date</p>
                                <p className="text-sm font-medium text-white">{item.date}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-white/35 md:hidden">Session</p>
                                <p className="text-sm font-medium text-white">{item.label}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-white/35 md:hidden">Issues</p>
                                <p className="text-sm text-white/70">{item.issues} detected</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.22em] text-white/35 md:hidden">Result summary</p>
                                <p className="text-sm leading-6 text-white/58">{item.summary}</p>
                            </div>
                            <div>
                                <button className="inline-flex items-center gap-2 text-sm font-medium text-sky-100 transition hover:text-white">
                                    Review Analysis
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </GlassCard>
        </section>
    )
}