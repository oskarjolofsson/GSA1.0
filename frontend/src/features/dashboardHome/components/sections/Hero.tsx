import { ArrowRight, ArrowUpRight, PlayCircle } from "lucide-react"
import { motion } from "framer-motion"
import GlassCard from "../GlassCard"
import FocusRing from "../FocusRing"
import { cn } from "../../utils/cn"
import { getTrendMeta } from "../../utils/getTrendData"

const focusIssue = {
  title: "Early Extension",
  diagnosis:
    "Your hips are moving toward the ball too early through impact, making clean contact harder to repeat.",
  averageScore: 74,
  trend: "up",
  delta: 12,
  status: "Improving",
  nextStep: "Continue with hip-depth rehearsals and slow-motion impact reps.",
};


export default function Hero() {
    const focusTrend = getTrendMeta(focusIssue.trend);
    const FocusTrendIcon = focusTrend.icon;

    return (
        <section className="mt-8">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.1 }}
            >
                <GlassCard className="relative overflow-hidden p-5 sm:p-7 lg:p-8">
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(125,211,252,0.12),transparent_35%,transparent_70%,rgba(165,243,252,0.08))]" />
                    <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-sky-300/8 blur-3xl" />

                    <div className="relative grid gap-8 lg:grid-cols-[1.5fr_0.85fr] lg:items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs uppercase tracking-[0.24em] text-white/60">
                                <PlayCircle className="h-3.5 w-3.5" />
                                Today’s Focus
                            </div>

                            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                {focusIssue.title}
                            </h2>
                            <p className="mt-3 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
                                {focusIssue.diagnosis}
                            </p>

                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium", focusTrend.tone)}>
                                    <FocusTrendIcon className="h-4 w-4" />
                                    {focusIssue.status}
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/62">
                                    <ArrowUpRight className="h-4 w-4 text-sky-200" />
                                    Up {focusIssue.delta}% over your last 5 sessions
                                </div>
                            </div>



                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-300 to-cyan-200 px-5 py-3.5 text-sm font-semibold text-slate-950 transition duration-200 hover:scale-[1.02] hover:shadow-[0_10px_40px_rgba(125,211,252,0.22)]">
                                    Start Practice
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                                <button className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-3.5 text-sm font-medium text-white/78 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white">
                                    View Details
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 text-center">
                            <FocusRing value={focusIssue.averageScore} />
                            <p className="mt-5 text-sm uppercase tracking-[0.22em] text-white/40">
                                Practice momentum
                            </p>
                            <p className="hidden md:block mt-2 max-w-xs text-sm leading-6 text-white/58">
                                Your recent work is moving this issue in the right direction.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>
        </section>
    )
}