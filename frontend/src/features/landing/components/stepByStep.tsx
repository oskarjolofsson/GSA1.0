

type StepItem = {
  number: string;
  title: string;
  description: string;
  imageSrc?: string;
};

type StepByStepProps = {
  steps?: StepItem[];
};

const defaultSteps: StepItem[] = [
    {
      number: "01",
      title: "Upload your swing video",
      description: "Start with a quick video of your swing.",
      imageSrc: "/media/klittor.jpg",
    },
    {
      number: "02",
      title: "Get AI-identified issues instantly",
      description: "See what’s holding your swing back right away.",
      imageSrc: "/media/pose2.jpg",
    },
    {
      number: "03",
      title: "Practice targeted drills with measurable results",
      description: "Work on the right fixes and see your progress over time.",
      imageSrc: "/media/klittor.jpg",
    },
  ];

export default function StepByStep({ steps = defaultSteps }: StepByStepProps) {

  return (
    <section className="relative overflow-hidden text-white">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-10 top-20 h-40 w-40 rounded-full bg-cyan-400/5 blur-3xl" />
        {/* <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.94),rgba(2,6,23,1))]" /> */}
      </div>

      {/* <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.65)_1px,transparent_1px)] [background-size:56px_56px]" /> */}

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto max-w-3xl px-1 text-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm">
            Simple, clear, and built for better golf
          </div>

          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:mt-6 sm:text-4xl lg:text-5xl">
            How It Works
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/65 sm:mt-4 sm:max-w-2xl sm:text-lg sm:leading-7">
            Go from swing video to a clear improvement plan in three simple steps.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-6xl sm:mt-14">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
            {steps.map((step, index) => (
              <div key={step.number} className="contents">
                <div className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5 p-3 shadow-2xl shadow-black/25 backdrop-blur-xl sm:rounded-[2rem] sm:p-4">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(74,222,128,0.08),transparent_45%)] opacity-60 transition duration-300 group-hover:opacity-100" />
                  <div className="absolute right-6 top-6 h-20 w-20 rounded-full bg-emerald-400/10 blur-2xl" />

                  <div className="relative h-full rounded-[1.125rem] border border-white/10 bg-slate-900/85 p-4 sm:rounded-[1.5rem] sm:p-7">
                    {step.imageSrc && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[1.125rem] bg-cover bg-center bg-no-repeat opacity-45 sm:rounded-[1.5rem]"
                        style={{ backgroundImage: `url(${step.imageSrc})` }}
                      />
                    )}

                    {step.imageSrc && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[1.125rem] bg-[linear-gradient(to_bottom,rgba(2,6,23,0.65),rgba(2,6,23,0.86))] sm:rounded-[1.5rem]"
                      />
                    )}

                    {!step.imageSrc && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[1.125rem] bg-[linear-gradient(to_bottom,rgba(2,6,23,0.62),rgba(2,6,23,0.82))] sm:rounded-[1.5rem]"
                      />
                    )}

                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-xs font-semibold text-emerald-300 shadow-[0_0_28px_rgba(74,222,128,0.08)] sm:h-12 sm:w-12 sm:rounded-2xl sm:text-sm">
                      {step.number}
                    </div>

                    <h3 className="relative z-10 mt-4 text-lg font-semibold leading-tight text-white sm:mt-6 sm:text-2xl">
                      {step.title}
                    </h3>

                    <p className="relative z-10 mt-3 text-sm leading-6 text-white/65 sm:mt-4 sm:text-base sm:leading-7">
                      {step.description}
                    </p>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex items-center justify-center py-1 lg:hidden">
                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200/90 shadow-[0_0_24px_rgba(74,222,128,0.08)]">
                      <span>↓</span>
                      <span>Next step</span>
                    </div>
                  </div>
                )}

                {index < steps.length - 1 && (
                  <div className="hidden items-center justify-center lg:flex">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-xl text-emerald-300 shadow-[0_0_30px_rgba(74,222,128,0.12)] motion-safe:animate-pulse">
                      →
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
