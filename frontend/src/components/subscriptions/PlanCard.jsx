import { useState } from "react";
import { Check, Star, Loader2 } from "lucide-react";

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
  isCurrentPlan = false,
  isActiveCycle = false,
  onSelect,
  price_id_monthly,
  price_id_yearly,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const price = cycle === "monthly" ? monthlyPrice : yearlyPrice;
  // const priceId = cycle === "monthly" ? price_id_monthly : price_id_yearly;

  const handleClick = async () => {
    // Disable only when the currently viewed cycle matches the active subscription
    if (isActiveCycle || isLoading) return;
    try {
      setIsLoading(true);
      const maybePromise = onSelect?.(id, cycle);
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Plan selection failed:", err);
    } finally {
      // If navigation didn't occur, allow retry
      setIsLoading(false);
    }
  };

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
            {popular && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 text-white text-xs px-2 py-1">
                <Star className="h-3 w-3" aria-hidden /> Most popular
              </span>
            )} 
            {isCurrentPlan && (
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
          <span className="text-sm text-white/70">/ mo</span>
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
          onClick={handleClick}
          disabled={isActiveCycle || isLoading}
          aria-disabled={isActiveCycle || isLoading}
          aria-busy={isLoading}
          className={`w-full rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
            isActiveCycle || isLoading
              ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-50 cursor-not-allowed"
              : popular
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-slate-900/90 text-white hover:bg-slate-900 dark:bg-slate-100 dark:text-black"
          }`}
        >
          {isLoading ? (
            <span className="inline-flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Loading…
            </span>
          ) : isActiveCycle ? (
            "Selected"
          ) : (
            "Choose plan"
          )}
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

