import { LineChart, TrendingDown, TrendingUp } from "lucide-react";

export function getTrendMeta(trend: string) {
  if (trend === "up") {
    return {
      label: "Improving",
      icon: TrendingUp,
      tone:
        "text-emerald-200 bg-emerald-400/10 border-emerald-300/15",
      barClass: "from-emerald-300 via-sky-300 to-cyan-200",
    };
  }

  if (trend === "down") {
    return {
      label: "Needs attention",
      icon: TrendingDown,
      tone: "text-rose-200 bg-rose-400/10 border-rose-300/15",
      barClass: "from-rose-300 via-orange-300 to-yellow-200",
    };
  }

  return {
    label: "Stalling",
    icon: LineChart,
    tone:
      "text-slate-200 bg-white/5 border-white/10",
    barClass: "from-slate-300 via-slate-200 to-white",
  };
}