import { useState, useEffect } from "react";
import InfoBox from "../result/result-box";

export default function DrillDropdown({ header, text, date, analysis, onViewMore }) {
  // we'll treat "open" as boolean here
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // fade-in on mount
  useEffect(() => {
    const timeout = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  // adapt the index-based setOpen expected by HeaderButton to our boolean state
  const setOpenAdapter = (idxOrNeg1) => setOpen(idxOrNeg1 !== -1);

  // build an item object to satisfy HeaderButton/Text signatures
  const item = { q: header, a: text };
  const active = open;

  useEffect(() => {
    const el = document.querySelector('.headerButton');
    if (el) console.log('BG:', getComputedStyle(el).backgroundColor);
  }, []);

  return (
    <>
      {HeaderButton(open, setOpenAdapter, active, item, 0, date, onViewMore)}
      {Text(active, item, date, analysis)}
    </>
  );
}

function HeaderButton(open, setOpen, active, item, i, date = null, onViewMore = null) {
  const handleViewMore = (e) => {
    e.stopPropagation();
    if (onViewMore) {
      onViewMore();
    }
  };

  return (
    <button
      className="
        w-full flex items-center justify-between gap-4
        px-5 py-4 text-left rounded-2xl
        min-w-0                 /* prevents overflow on narrow screens */
        /* colors */
        bg-gray-800 text-white/90 hover:bg-white/5
        border border-gray-700/50
        /* iOS/WebKit fixes */
        appearance-none
        [background-image:none]
        bg-clip-padding
        isolate
        will-change-transform
      "
      onClick={() => setOpen(active ? -1 : i)}
      aria-expanded={active}
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={handleViewMore}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
          title="More info"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-white/70 group-hover:text-white/90"
            fill="currentColor"
          >
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
        <span className="text-base sm:text-lg font-semibold truncate">{item.q}</span>
      </div>
      <span
        className={`grid h-7 w-7 place-items-center rounded-full ring-1 ring-white/10 transition-colors ${active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/70"
          }`}
      >
        {active ? (
          // Close (x)
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        ) : (
          // Plus
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
        )}
      </span>
    </button>
  );
}

function Text(active, item, date= null, analysis = null) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-400 ease-out ${active ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
    >
      
      <div className="overflow-hidden">
        <div className="px-5 mb-1">{date ? (<span className="text-xs sm:text-sm text-white/60 whitespace-nowrap">{date}</span>) : null}</div>
        <div className="px-5 pb-5 text-slate-300">
          {analysis ? <InfoBox analysis={analysis} /> : item.a}
        </div>
      </div>
    </div>
  );
}
