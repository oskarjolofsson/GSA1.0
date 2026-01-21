import { useEffect, useState } from "react";
import InfoBox from "../result/result-box";

export default function DrillDropdown({ header }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={`
        w-full flex items-center justify-between gap-4
        px-5 py-4 text-left rounded-2xl
        min-w-0
        bg-gray-800 text-white/90 hover:bg-white/5
        border border-gray-700/50
        transition
        select-none
        ${revealed ? "opacity-100" : "opacity-0"}
      `}
    >
      {/* Left side */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Visual-only "more" icon */}
        <div
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-white/70"
            fill="currentColor"
          >
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </div>

        <span className="text-base sm:text-lg font-semibold truncate">
          {header}
        </span>
      </div>

      {/* Right-side indicator (visual only) */}
      <span
        className="
          grid h-7 w-7 place-items-center
          rounded-full ring-1 ring-white/10
          bg-white/5 text-white/70
        "
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </div>
  );
}
