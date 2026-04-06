import { Check, Sparkles } from "lucide-react";

const benefits = [
  "1 free swing analysis to get started",
  "Unlimited swing analyses",
  "Clear feedback on what to fix",
  "Personalized drills for your swing issues",
  "Practice guidance that helps you improve faster",
];

type PricingSectionProps = {
  price?: string;
  period?: string;
  ctaText?: string;
  onCtaClick?: () => void;
};

export default function PricingSection({
  price = "€14.99",
  period = "/month",
  ctaText = "Go Pro",
  onCtaClick,
}: PricingSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">

          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            One plan. Everything you need to improve faster.
          </h2>

          <p className="mt-4 text-sm leading-6 text-white/65 sm:text-base">
            Start with 1 free analysis. When you are ready to keep improving,
            unlock unlimited access with one simple subscription.
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
                  TrueSwing Pro
                </p>
              </div>

              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                1 free analysis included
              </span>
            </div>

            <div className="mt-8 flex items-end gap-2">
              <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {price}
              </span>
              <span className="pb-1 text-sm text-white/55">{period}</span>
            </div>

            <p className="mt-3 text-sm leading-6 text-white/60">
              See what is wrong in your swing, know what to practice, and keep
              making progress without guessing.
            </p>

            <button
              type="button"
              onClick={onCtaClick}
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              {ctaText}
            </button>

            <p className="mt-3 text-center text-xs text-white/45">
              Your first analysis is free. Subscribe only when you want to keep going.
            </p>

            <div className="mt-8 h-px w-full bg-white/10" />

            <ul className="mt-8 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                  </div>
                  <span className="text-sm leading-6 text-white/80">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}