import { Eye, AlertCircle, CheckCircle } from "lucide-react";

export default function Issues() {
  const cards = [
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

  return (
    <div className="w-full h-full p-6 sm:p-8">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        {/* Image placeholder - square, 1/3 on desktop */}
        <div className="h-64 sm:h-80 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] overflow-hidden">
          <span className="text-slate-500 text-sm font-medium">Shot Image</span>
        </div>

        {/* Text content */}
        <div className="lg:col-span-2 flex flex-col justify-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Shot outcome
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Identify common issues in your golf swing and receive tailored drills to help you improve. Our AI-powered analysis breaks down exactly what's happening and provides actionable guidance.
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const colors = [
            "from-red-500/10 to-red-500/5 border-red-500/20",
            "from-yellow-500/10 to-yellow-500/5 border-yellow-500/20",
            "from-green-500/10 to-green-500/5 border-green-500/20",
          ];

          return (
            <div
              key={index}
              className={`rounded-3xl bg-gradient-to-br ${colors[index]} backdrop-blur-md border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] p-6 sm:p-8 transition-all duration-300 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                  <Icon className="w-5 h-5 text-white/80" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  {card.title}
                </h3>
              </div>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* CTA Button */}
      <div className="flex justify-center">
        <button className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-emerald-500/90 hover:bg-emerald-500 text-white font-semibold rounded-xl sm:rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:scale-105 active:scale-95">
          View Recommended Drills
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}