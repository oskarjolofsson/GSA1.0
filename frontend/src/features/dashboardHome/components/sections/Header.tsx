import { Flame, LandPlot, LineChart, Target } from "lucide-react"
import { motion } from "framer-motion"
import StatCard from "../StatCard"


const user = {
  name: "Alex",
  totalAnalyses: 24,
  activeIssues: 5,
  streak: 9,
  weeklySessions: 3,
};


export default function Header() {

    return (
        <section>
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
            >
                <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/10 bg-white/[0.04] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-sky-100/80">
                        <LandPlot className="h-3.5 w-3.5" />
                        Dashboard
                    </div>
                    <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Welcome back, {user.name}
                    </h1>
                </div>

                <div className="hidden xl:grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">

                    <StatCard
                        label="Total analyses"
                        value={user.totalAnalyses}
                        icon={LineChart}
                    />
                    <StatCard
                        label="Active issues"
                        value={user.activeIssues}

                        icon={Target}
                    />
                    <StatCard
                        label="Practice streak"
                        value={`${user.streak} days`}
                        icon={Flame}
                    />
                </div>
            </motion.div>
        </section>
    )
}