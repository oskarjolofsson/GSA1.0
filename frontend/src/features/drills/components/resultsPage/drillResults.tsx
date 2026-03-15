import type { DrillRun } from "@/features/drills/types";
import { Cell, Pie, PieChart } from "recharts";

const CHART_COLORS = {
    success: "#22c55e",
    failed: "#ef4444",
    remaining: "#475569",
};

export default function DrillResults({ drillRuns }: { drillRuns: DrillRun[] }) {
    const total = 12;

    return (
        <section className="xl:col-span-2 rounded-2xl border border-slate-700/60 bg-slate-900/70 backdrop-blur-sm shadow-xl p-4 md:p-6">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-semibold text-slate-100">Drill Progress</h2>
            </div>

            {/* If on mobile, show a compact pie chart view. On larger screens, show a detailed list with charts and stats. */}
            <div className="grid grid-cols-3 gap-2 sm:hidden">
                {drillRuns.map((result) => {
                    const attempted = result.successful_reps + result.failed_reps;
                    const remaining = Math.max(total - attempted, 0);
                    const completion = total > 0 ? Math.round((attempted / total) * 100) : 0;

                    const pieData = [
                        { name: "Success", value: result.successful_reps, color: CHART_COLORS.success },
                        { name: "Failed", value: result.failed_reps, color: CHART_COLORS.failed },
                        { name: "Remaining", value: remaining, color: CHART_COLORS.remaining },
                    ];

                    return (
                        <div key={result.id} className="flex flex-col items-center">
                            <div className="relative h-20 w-20">
                                <PieChart width={80} height={80}>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={20}
                                        outerRadius={32}
                                        stroke="none"
                                        paddingAngle={2}
                                    >
                                        {pieData.map((entry) => (
                                            <Cell key={`${result.id}-mobile-${entry.name}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                                    <p className="text-xs font-semibold text-slate-100">{pieData[0].value / total * 100 || 0}%</p>
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-slate-300 capitalize text-center">{result.id}</p>
                        </div>
                    );
                })}
            </div>

            {/* If on larger screens, show a detailed list with charts and stats. */}
            <div className="hidden sm:block space-y-3 md:space-y-4">
                {drillRuns.map((result) => {
                    const attempted = result.successful_reps + result.failed_reps;
                    const remaining = Math.max(total - attempted, 0);
                    const completion = total > 0 ? Math.round((attempted / total) * 100) : 0;

                    const pieData = [
                        { name: "Success", value: result.successful_reps, color: CHART_COLORS.success },
                        { name: "Failed", value: result.failed_reps, color: CHART_COLORS.failed },
                        { name: "Remaining", value: remaining, color: CHART_COLORS.remaining },
                    ];

                    return (
                        <article
                            key={result.id}
                            className="rounded-xl border border-slate-700/60 bg-slate-800/70 px-3 py-3 md:px-4 md:py-4 flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4"
                        >
                            <div className="relative h-24 w-24 shrink-0 mx-auto sm:mx-0">
                                <PieChart width={96} height={96}>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={26}
                                        outerRadius={40}
                                        stroke="none"
                                        paddingAngle={2}
                                    >
                                        {pieData.map((entry) => (
                                            <Cell key={`${result.id}-${entry.name}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                                    <div>
                                        <p className="text-base font-semibold text-slate-100">{pieData[0].value / total * 100 || 0}%</p>
                                        <p className="text-[10px] uppercase tracking-wide text-slate-400"></p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-base md:text-lg font-medium text-slate-100 capitalize">{result.id}</h3>
                                <p className="text-xs md:text-sm text-slate-400">{attempted}/{total} attempts completed</p>

                                <div className="mt-3 grid grid-cols-3 gap-2 text-xs md:text-sm">
                                    <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-2 py-1.5 text-green-300">
                                        Success: {result.successful_reps}
                                    </div>
                                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-2 py-1.5 text-red-300">
                                        Failed: {result.failed_reps}
                                    </div>
                                    <div className="rounded-lg bg-slate-700/60 border border-slate-600/70 px-2 py-1.5 text-slate-300">
                                        Remaining: {remaining}
                                    </div>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    )
}