import { useEffect, useState } from "react";
export default function TextPage() {
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReveal(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className="relative w-full max-w-4xl mx-auto px-4 mt-[10vh] my-12">
      <div
        className={`rounded-3xl bg-[#0e1428]/80 backdrop-blur-md border border-white/10 p-6 sm:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out will-change-transform ${reveal ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >
        <div className="text-content">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6">Some header</h1>

          <h2 className="text-xl font-semibold text-white mb-2">Our Mission</h2>
          <p className="text-slate-300 mb-6 leading-relaxed">
            lalalalallalalalalalalal this comes later
          </p>

          <h2 className="text-xl font-semibold text-white mb-2">Our Vision</h2>
          <p className="text-slate-300 mb-6 leading-relaxed">
            this sounds important but probably is not
          </p>

          <h2 className="text-xl font-semibold text-white mb-2">Our Values</h2>
          <p className="text-slate-300 leading-relaxed">
            To be the best I guess
          </p>
        </div>
      </div>
    </section>
  );
}
