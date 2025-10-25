import { useState, useEffect } from "react";

export default function DrillDropdown({ header, text, date }) {
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

  return (
    <div className={`rounded-2xl bg-white/5 border border-white/10`}>
      {HeaderButton(open, setOpenAdapter, active, item, 0, date)}
      {Text(active, item)}
    </div>
  );
}

function HeaderButton(open, setOpen, active, item, i, date  = null) {
  return (
    <button
      className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 text-white/90 hover:bg-white/7 rounded-2xl"
      onClick={() => setOpen(active ? -1 : i)}
      aria-expanded={active}
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className="text-base sm:text-lg font-semibold truncate">{item.q}</span>
        {date ? (
          <span className="text-xs sm:text-sm text-white/60 whitespace-nowrap">{date}</span>
        ) : null}
      </span>
      <span
        className={`grid h-7 w-7 place-items-center rounded-full ring-1 ring-white/10 transition-colors ${
          active ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/70"
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

function Text(active, item) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-400 ease-out ${
        active ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <div className="px-5 pb-5 text-slate-300">{item.a}</div>
      </div>
    </div>
  );
}
