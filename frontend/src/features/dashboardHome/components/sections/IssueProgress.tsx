import IssueMiniCard from "../IssueMiniCard";
import type { Issue } from "@/features/issues/types";

const issueMomentum = [
  { name: "Early Extension", score: 74, trend: "up", status: "Improving" },
  { name: "C-Posture", score: 48, trend: "down", status: "Needs attention" },
  { name: "Loss of Posture", score: 62, trend: "up", status: "Trending better" },
  { name: "Over The Top", score: 56, trend: "flat", status: "Stalling" },
  { name: "Reverse Spine Angle", score: 69, trend: "up", status: "Improving" },
  { name: "Early Release", score: 51, trend: "down", status: "Needs attention" },
];

export default function IssueProgress( {issues} : {issues: Issue[]}) {
    return (
        <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/38">Momentum</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        Progress across your swing
                    </h3>
                </div>

            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {issues.map((issue) => (
                    <IssueMiniCard key={issue.id} issue={issue} />
                ))}
            </div>
        </section>
    )
}