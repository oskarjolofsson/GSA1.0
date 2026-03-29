import { TypeAnimation } from 'react-type-animation';

export default function SolutionSection() {
  const solutionSteps = [
    "Identify what’s wrong in your swing",
    "Get drills specifically designed to fix it",
    "Practice with purpose — not guesswork",
    "Track your improvement over time",
  ];

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute left-0 top-32 h-[240px] w-[240px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-0 top-20 h-[240px] w-[240px] rounded-full bg-cyan-400/5 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.95),rgba(2,6,23,1))]" />
      </div>

      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.65)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-md">
            From confusion to a clear plan
          </div>

          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            TrueSwing connects the dots for you.
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-6xl">
          <div className="grid gap-4 md:gap-5 lg:grid-cols-[0.9fr_auto_1.1fr] lg:items-stretch">
            {/* Problem side */}
            <div className="relative overflow-hidden rounded-[2rem] border border-rose-400/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="absolute right-8 top-8 h-32 w-32 rounded-full bg-rose-400/18 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(244,63,94,0.14),transparent_48%)]" />

              <div className="relative rounded-[1.5rem] border border-rose-400/10 bg-slate-900/88 p-6 sm:p-7">
                <div className="inline-flex items-center rounded-full border border-rose-400/15 bg-rose-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200/80">
                  The problem
                </div>

                <h3 className="mt-5 max-w-md text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  Most golfers know something feels wrong — but not what.
                </h3>

                <p className="mt-4 max-w-md text-base leading-7 text-white/70 sm:text-lg">
                  And even if you do, what should you actually practice?
                </p>

                <div className="mt-8 rounded-[1.5rem] border border-rose-400/10 bg-rose-950/20 p-5">
                  <div className="space-y-3 text-white/72">
                    <TypeAnimation
                        sequence={[
                            "Hitting balls without direction",
                            3000,
                            "Guessing what to work on",
                            3000,
                            "Reinforcing the same mistakes",
                            3000,
                        ]}
                        repeat={Infinity}
                        cursor={false}
                        className="text-base sm:text-lg"
                        wrapper="p"
                        speed={70}
                        deletionSpeed={90}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Flow indicator */}
            <div className="hidden lg:flex items-center justify-center lg:px-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-xl text-emerald-300 shadow-[0_0_30px_rgba(74,222,128,0.12)] motion-safe:animate-pulse">
                →
              </div>
            </div>

            <div className="flex items-center justify-center lg:hidden">
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-200/90 shadow-[0_0_30px_rgba(74,222,128,0.08)]">
                <span className="text-base">↓</span>
                <span>Here’s the fix</span>
              </div>
            </div>

            {/* Solution side */}
            <div className="relative overflow-hidden rounded-[2rem] border border-emerald-400/25 bg-emerald-400/[0.05] p-4 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
              <div className="absolute right-8 top-8 h-32 w-32 rounded-full bg-emerald-400/18 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(74,222,128,0.14),transparent_48%)]" />

              <div className="relative rounded-[1.5rem] border border-emerald-400/20 bg-slate-900/88 p-6 sm:p-7">
                <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
                  The solution
                </div>

                <h3 className="mt-5 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  TrueSwing connects the dots for you.
                </h3>

                <div className="mt-8 grid gap-3 sm:gap-4">
                  {solutionSteps.map((step, index) => (
                    <div
                      key={step}
                      className="group relative overflow-hidden rounded-[1.35rem] border border-emerald-400/10 bg-emerald-400/[0.04] p-4 transition duration-300 hover:border-emerald-400/30 hover:bg-emerald-400/[0.07]"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(74,222,128,0.12),transparent_45%)] opacity-60 transition duration-300 group-hover:opacity-100" />

                      <div className="relative flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-400/12 text-sm font-semibold text-emerald-200 shadow-[0_0_32px_rgba(74,222,128,0.12)]">
                          0{index + 1}
                        </div>
                        <p className="pt-0.5 text-base leading-7 text-white sm:text-lg">
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
