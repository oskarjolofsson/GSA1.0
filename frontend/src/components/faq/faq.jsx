import { useState, useEffect, useRef } from "react";


const defaultFaqs = [
  {
    q: "How can this app improve my training?",
    a: "Upload short clips, get instant analysis, and clear action items. Most users see improvements within their first week of using it consistently.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. Manage your plan from account settings. If you need help with anything, our human support team is ready to assist.",
  },
  {
    q: "Do I need to be a pro to use it?",
    a: "Not at all. The guidance is beginner‑friendly while still powerful for coaches and advanced athletes.",
  },
  {
    q: "What kind of content can I upload?",
    a: "Short videos (vertical or horizontal) work best. We support common formats like MP4 and MOV.",
  },
  {
    q: "How much control do I have over AI suggestions?",
    a: "You control everything. Accept, tweak, or ignore any suggestion. Your data remains private by default.",
  },
];



function Header() {
  return (
    <div className="text-center mb-10">
      <span className="inline-flex items-center gap-2 text-emerald-400/90 text-sm ring-1 ring-emerald-400/20 rounded-full px-3 py-1 bg-emerald-400/5">
        FAQs
      </span>
      <h2 className="mt-4 text-3xl sm:text-5xl font-bold text-white tracking-tight">
        Frequently Asked Questions
      </h2>
    </div>
  );
}


function FAQBox(items = defaultFaqs) {
  const [open, setOpen] = useState(0); // index of open item
  const [revealed, setRevealed] = useState(false);
  const frameRef = useRef(null);

  // reveal frame when it enters viewport
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          setRevealed(true);
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);


  return (
    <div
      ref={frameRef}
      className={`rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-4 sm:p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out will-change-transform ${
        revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <ul className="space-y-4">
        {items.map((item, i) => {
          const active = open === i;
          return (
            <li key={i} className="rounded-2xl bg-white/5 border border-white/10">
              {QuestionButton(open, setOpen, active, item, i)}
              {Answer(active, item)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}


function QuestionButton(open, setOpen, active, item, i) {
  return (
    <button
      className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 text-white/90 hover:bg-white/7 rounded-2xl"
      onClick={() => setOpen(active ? -1 : i)}
      aria-expanded={active}
    >
      <span className="text-base sm:text-lg font-semibold">{item.q}</span>
      <span
        className={`grid h-7 w-7 place-items-center rounded-full ring-1 ring-white/10 transition-colors ${
          active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/70'
        }`}
      >
        {active ? (
          // Close (x)
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
        ) : (
          // Plus
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        )}
      </span>
    </button>
  )
}


function Answer(active, item) {
  return (
    <div className={`grid transition-[grid-template-rows] duration-400 ease-out ${active ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
      <div className="overflow-hidden">
        <div className="px-5 pb-5 text-slate-300">
          {item.a}
        </div>
      </div>
    </div>
  )
}


export default function FAQ({ items = defaultFaqs }) {
  return (
    <div className="text-slate-100 relative overflow-hidden py-16">
      <section className="relative mx-auto w-full max-w-5xl px-4 py-12">
        {Header()}
        {FAQBox( items )}
      </section>
    </div>
  );
}