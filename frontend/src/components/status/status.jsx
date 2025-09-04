import { useState, useEffect, useRef } from "react";
const API = import.meta.env.VITE_API_URL;

export default function Status() {
  const [status, setStatus] = useState("Checking...");
  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef(null);

  // Function to check if the backend is responding
  async function checkBackendStatus() {
    try {
      const res = await fetch(API, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json(); // ← extract JSON

      setStatus("Online ✅: " + data.message || "");
    } catch (err) {
      setStatus("Offline: Backend could not be reached");
    }
  }

  useEffect(() => {
    checkBackendStatus();
  }, []);

  // Reveal-on-scroll: slide up from below when section enters viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="text-slate-100 flex items-start justify-center relative overflow-hidden py-10">
      
      
      

      <section className="relative mx-auto max-w-3xl w-full px-4">
        <div
          ref={cardRef}
          className={`rounded-3xl bg-[#0e1428]/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] p-6 sm:p-10 transition-all duration-700 ease-out will-change-transform ${
            revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Backend Status</h2>
          <div className="rounded-2xl border border-dashed border-slate-500/40 bg-[#0e1428]/70 dark:bg-slate-800/70 p-6 text-slate-200">
            <p className="text-base font-medium">{status}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
