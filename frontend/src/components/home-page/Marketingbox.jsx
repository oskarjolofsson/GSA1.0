import { Link } from "react-router-dom";

// Simple icon set for the feature list
const Icon = ({ name }) => {
  const common = "h-5 w-5";
  switch (name) {
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={common} aria-hidden>
          <path d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />
        </svg>
      );
    case "target":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v3M21 12h-3M12 21v-3M3 12h3" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={common} aria-hidden>
          <path d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
        </svg>
      );
    default:
      return null;
  }
};

/**
 * MarketingBox – a compact promo card
 *
 * Usage:
 * <MarketingBox />
 * <MarketingBox header="Lightning-fast insights" subtext="AI-powered feedback in seconds" />
 */
export default function MarketingBox({
  header = "Stop Guessing. Start Improving",
  subtext = "",
  className = "",
  features = [
    { icon: "target", title: "No more guessing what went wrong.", desc: "Frame-by-frame analysis pinpoints the ONE thing you need to fix with tailored drills from our AI coach" },
    { icon: "bolt", title: "Analysis in 60 Seconds", desc: "From phone video to personalized report in less than a minute. No more waiting." },
    { icon: "shield", title: "Practice Without Judgment", desc: "Your video is for your eyes only. Secure processing and auto-deletion ensures your swing is completely private." },
  ],
}) {
  return (
    <div
      className={`relative not-prose w-full max-w-3xl mx-auto text-center px-4 sm:px-6 mt-10 sm:mt-12 md:mt-16 mb-20 ${className}`}
      role="complementary"
      aria-label="Marketing message"
    >
      {/* Eyebrow */}
      <span className="inline-flex items-center gap-2 text-emerald-400/90 text-sm ring-1 ring-emerald-400/20 rounded-full px-3 py-1 bg-emerald-400/5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Instant AI Analysis
      </span>

      {/* Heading */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight !text-slate-900 !text-white mt-2">
        {header}
      </h2>

      {/* Subtext */}
      <p className="mt-3 text-base sm:text-lg md:text-xl leading-relaxed !text-slate-600">
        {subtext}
      </p>

      {/* Optional divider flair */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Feature list */}
      <ul role="list" className="mt-8 space-y-4 text-left">
        {features.map((f, i) => (
          <li key={i} className="py-2">
            <div className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <Icon name={f.icon} />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-semibold !text-slate-900 !text-white">{f.title}</h3>
                <p className="mt-1 text-sm sm:text-base leading-relaxed !text-slate-600 !text-slate-300">{f.desc}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* CTA (optional for later) */}
      <div className="mt-4">
        <Link to="/analyse" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 bg-emerald-500/90 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-colors">
          Try it for free
        </Link>
      </div>
    </div>
  );
}
