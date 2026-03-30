

export default function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '$19',
      period: '/mo',
      description: 'A simple way to start improving with more structure.',
      features: [
        'Swing uploads',
        'Issue breakdowns',
        'Practice guidance',
        'Session history',
      ],
      cta: 'Start with Starter',
      featured: false,
    },
    {
      name: 'Performance',
      price: '$49',
      period: '/mo',
      description: 'More insight, more feedback, and a clearer path to better golf.',
      features: [
        'Everything in Starter',
        'Advanced feedback',
        'More drill access',
        'Deeper progress tracking',
        'Priority improvements',
      ],
      cta: 'Choose Performance',
      featured: true,
      badge: 'Most Popular',
    },
  ];

  return (
    <section className="relative overflow-hidden px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-[260px] w-[260px] rounded-full bg-cyan-400/5 blur-3xl" />
        {/* <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.94),rgba(2,6,23,1))]" /> */}
      </div>

      {/* <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.65)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.65)_1px,transparent_1px)] [background-size:56px_56px]" /> */}

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-md">
            Pricing
          </div>

          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Choose the plan that fits your game
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:text-base sm:leading-7 lg:text-lg">
            Start simple or unlock a more premium practice experience. Both plans are built to make improvement easier to understand.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={[
                'group relative overflow-hidden rounded-[2rem] border p-4 shadow-2xl backdrop-blur-xl transition duration-300',
                plan.featured
                  ? 'border-emerald-400/20 bg-emerald-400/[0.06] shadow-emerald-950/20 lg:-translate-y-3 hover:-translate-y-4'
                  : 'border-white/10 bg-white/5 shadow-black/30 hover:-translate-y-2',
              ].join(' ')}
            >
              {plan.featured && (
                <div className="absolute right-5 top-5 z-10 rounded-full border border-emerald-300/20 bg-emerald-300/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/90 shadow-[0_0_30px_rgba(110,231,183,0.12)]">
                  {plan.badge}
                </div>
              )}

              <div
                className={[
                  'absolute inset-0',
                  plan.featured
                    ? 'bg-[linear-gradient(135deg,rgba(74,222,128,0.14),transparent_48%)]'
                    : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_48%)]',
                ].join(' ')}
              />

              {plan.featured && (
                <div className="absolute right-10 top-10 h-28 w-28 rounded-full bg-emerald-400/16 blur-3xl" />
              )}

              <div
                className={[
                  'relative h-full rounded-[1.5rem] border p-6 sm:p-7',
                  plan.featured
                    ? 'border-emerald-400/15 bg-slate-900/88'
                    : 'border-white/10 bg-slate-900/84',
                ].join(' ')}
              >
                <div className="pr-28">
                  <h3 className="text-2xl font-semibold text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-8 flex items-end gap-2">
                  <span className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
                    {plan.price}
                  </span>
                  <span className="pb-1 text-base font-medium text-white/55 sm:pb-1.5">
                    {plan.period}
                  </span>
                </div>

                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/15 px-4 py-3"
                    >
                      <div
                        className={[
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold',
                          plan.featured
                            ? 'border-emerald-300/25 bg-emerald-300/12 text-emerald-200'
                            : 'border-white/15 bg-white/5 text-white/70',
                        ].join(' ')}
                      >
                        ✓
                      </div>
                      <span className="text-sm text-white/80 sm:text-base">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <button
                    className={[
                      'inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-sm font-semibold transition duration-300 sm:text-base',
                      plan.featured
                        ? 'border border-emerald-300/20 bg-emerald-300/90 text-slate-950 shadow-[0_0_40px_rgba(110,231,183,0.16)] hover:scale-[1.01] hover:bg-emerald-300'
                        : 'border border-white/10 bg-white/5 text-white hover:bg-white/8',
                    ].join(' ')}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
