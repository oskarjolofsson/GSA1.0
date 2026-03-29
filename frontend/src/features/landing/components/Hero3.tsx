import { useNavigate } from "react-router-dom";

type HeroSectionProps = {
  imageUrl?: string;
};

export default function HeroSection({ imageUrl }: HeroSectionProps) {
    const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-[-120px] top-24 h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute left-[-100px] bottom-0 h-[280px] w-[280px] rounded-full bg-lime-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.35),rgba(2,6,23,0.95))]" />
      </div>

      {/* Grid texture */}
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl items-center px-6 py-20 sm:px-8 lg:px-12">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left content */}
          <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
            <div className="mb-6 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
              Find the issue • Get the fix • Play better golf
            </div>

            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
              Fix Your Swing. Know What to Practice.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-white/70 sm:text-lg lg:mx-0 lg:text-xl">
              Upload your swing and get clear feedback, drills, and a simple plan to improve.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <button className="group inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-emerald-400 px-6 py-4 text-base font-semibold text-slate-950 shadow-[0_0_40px_rgba(74,222,128,0.25)] transition hover:scale-[1.02] hover:shadow-[0_0_55px_rgba(74,222,128,0.35)]"
              onClick={() => navigate("/dashboard/upload")}
              >
                Analyze My Swing
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </button>

              <button className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/10">
                See a Demo
              </button>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-white/55 lg:justify-start">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Know what to fix
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Practice the right drills
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Build a better swing
              </div>
            </div>
          </div>

          {/* Right image transformation card */}
          <div className="mx-auto w-full max-w-xl ">
            <div className="group relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl">
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt="Golfer practicing swing"
                    className="absolute inset-0 h-full w-full object-cover opacity-65 blur-[1px] saturate-75 contrast-75"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(2,6,23,0.92),rgba(2,6,23,0.45),rgba(2,6,23,0.68))]" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(74,222,128,0.16),transparent_28%),radial-gradient(circle_at_72%_28%,rgba(255,255,255,0.08),transparent_24%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(30,41,59,0.88),rgba(2,6,23,1))]" />
                  <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:44px_44px]" />
                  <div className="absolute -right-8 top-6 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
                  <div className="absolute left-8 top-10 h-[72%] w-[55%] rounded-[999px] bg-gradient-to-b from-white/8 via-white/4 to-transparent blur-sm" />
                  <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent" />
                  <div className="absolute bottom-14 left-1/2 h-[58%] w-[34%] -translate-x-1/2 rounded-t-[999px] rounded-b-[28%] bg-white/8 blur-[2px]" />
                  <div className="absolute bottom-[34%] left-[52%] h-[22%] w-[36%] -translate-x-1/2 rotate-[-22deg] rounded-full bg-white/7 blur-[2px]" />
                  <div className="absolute bottom-[39%] left-[50%] h-[18%] w-[18%] -translate-x-1/2 rounded-full bg-white/9 blur-[1px]" />
                  <div className="absolute bottom-[14%] left-[44%] h-[24%] w-[8%] rotate-[6deg] rounded-full bg-white/7 blur-[1px]" />
                  <div className="absolute bottom-[14%] left-[52%] h-[26%] w-[8%] rotate-[-8deg] rounded-full bg-white/7 blur-[1px]" />
                </>
              )}

              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.22),transparent_35%,rgba(2,6,23,0.65))]" />

              <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md transition duration-500 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
                  <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">Before</p>
                      <div className="mt-2.5 space-y-1.5 text-white/68">
                        <p className="text-base font-medium sm:text-lg">Inconsistent shots</p>
                        <p className="text-base font-medium sm:text-lg">Guessing what to practice</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg text-emerald-300 shadow-[0_0_28px_rgba(74,222,128,0.12)] transition motion-safe:animate-pulse">
                        →
                      </div>
                    </div>

                    <div className="relative rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-left shadow-[0_0_42px_rgba(74,222,128,0.12)]">
                      <div className="absolute inset-0 rounded-2xl bg-emerald-400/5 blur-2xl" />
                      <div className="relative">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/90">After using TrueSwing</p>
                        <div className="mt-2.5 space-y-1.5 text-white">
                          <p className="text-base font-semibold sm:text-lg">Clear plan</p>
                          <p className="text-base font-semibold sm:text-lg">Consistent, confident shots</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
