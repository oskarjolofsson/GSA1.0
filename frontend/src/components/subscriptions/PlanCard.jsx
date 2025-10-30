import { Check, Star } from "lucide-react";

export default function PlanCard({
  id,
  name,
  description,
  monthlyPrice,
  yearlyPrice,
  features,
  currency = "EUR",
  cycle = "monthly",
  popular = false,
  isCurrent = false,
  onSelect,
}) {
  const price = cycle === "monthly" ? monthlyPrice : yearlyPrice;

  return (
    <div
      className={`relative flex flex-col h-full w-full 
  rounded-2xl border border-white/15 p-6 bg-white/5 backdrop-blur-sm shadow-sm text-white max-w-sm
  ${popular ? "ring-2 ring-white" : ""}`}

      aria-label={`${name} plan`}
    >
      {/* Top section - will stay at top */}
      <div className="flex-none">
        {/* Badges */}
          <div className="flex items-center gap-2 mb-4 min-h-[28px] lg:absolute md:top-6 md:right-6">
            {/* {popular && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 text-white text-xs px-2 py-1">
                <Star className="h-3 w-3" aria-hidden /> Most popular
              </span>
            )} */}
            {isCurrent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 text-white text-xs px-2 py-1">
                Current plan
              </span>
            )}
          </div>

          {/* Header */}
        <h3 className="text-xl font-semibold">{name}</h3>
        <div className="min-h-[20px]">
          {description && (
            <p className="mt-1 text-sm text-white/70">{description}</p>
          )}
        </div>

        {/* Price */}
        <div className="mt-5 flex items-end gap-1">
          <span className="text-4xl font-semibold tracking-tight">
            {formatMoney(price, currency)}
          </span>
          <span className="text-sm text-white/70">/ {cycle === "monthly" ? "mo" : "yr"}</span>
        </div>
      </div>

      {/* Features - will grow to fill space */}
      <ul className="mt-6 space-y-3 flex-grow">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* Bottom section - will stay at bottom */}
      <div className="flex-none mt-6">
        {/* CTA */}
        <button
          onClick={() => !isCurrent && onSelect?.(id, cycle)}
          className={`w-full rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
            isCurrent
              ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 cursor-default"
              : popular
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-slate-900/90 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-black"
          }`}
          aria-disabled={isCurrent}
        >
          {isCurrent ? "Selected" : "Choose plan"}
        </button>

        {/* Small print */}
        <div className="mt-3 min-h-[16px]">
          {id !== "free" && (
            <p className="text-xs text-white/70">Billed {cycle}. Cancel anytime.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatMoney(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}