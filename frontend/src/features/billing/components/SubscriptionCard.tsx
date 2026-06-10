import { useEffect, useState } from 'react';
import { CreditCard, Sparkles, Clock, ArrowUpRight } from 'lucide-react';
import { ApiError } from '@/lib/errors';
import { useBilling } from '../BillingContext';
import { openCustomerPortal, startCheckout } from '../services/billing';
import { daysLeft } from '../utils/trial';

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

type Pill = { label: string; className: string };

export default function SubscriptionCard() {
  const { status, invalidate } = useBilling();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh billing status on mount — this is the page Stripe returns the user
  // to after the portal, so cancellations/plan changes must be picked up.
  useEffect(() => {
    invalidate();
  }, [invalidate]);

  const handlePortal = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await openCustomerPortal();
    } catch (e) {
      // No Stripe customer yet → send them through checkout instead.
      if (e instanceof ApiError && e.status === 404) {
        await startCheckout();
        return;
      }
      setError('Could not open the billing portal. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSubscribe = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await startCheckout();
    } catch {
      setError('Could not start checkout. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Derive what to render ────────────────────────────────────────────────
  // We branch on `canceled_at` (null only when genuinely renewing), NOT on
  // cancel_at_period_end — the latter misses immediate cancels and is just
  // Stripe's scheduling flag. status drives the payment-trouble path.
  const sub = status?.subscription ?? null;
  const endDate = formatDate(sub?.current_period_end ?? null);
  const canceledDate = formatDate(sub?.canceled_at ?? null);
  const isCanceling = Boolean(sub?.canceled_at) || Boolean(sub?.cancel_at_period_end);
  const hasPaymentTrouble = sub?.status === 'past_due' || sub?.status === 'unpaid';

  let pill: Pill;
  let detail: string;
  let subDetail: string | null = null;
  let cta: { label: string; busy: string; onClick: () => void };

  if (status?.is_subscribed) {
    cta = { label: 'Manage subscription', busy: 'Opening…', onClick: handlePortal };
    if (hasPaymentTrouble) {
      pill = { label: 'Payment issue', className: 'bg-red-400/15 text-red-200 ring-red-300/30' };
      detail = 'We could not process your last payment. Update your card to keep your subscription.';
    } else if (isCanceling) {
      pill = { label: 'Premium · ending', className: 'bg-amber-400/15 text-amber-200 ring-amber-300/30' };
      detail = endDate ? `Your plan ends ${endDate} — you keep access until then.` : 'Your plan is set to end and will not renew.';
      subDetail = canceledDate ? `Canceled on ${canceledDate}.` : null;
    } else {
      pill = { label: 'Premium', className: 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30' };
      detail = endDate ? `Renews ${endDate}.` : 'Your subscription is active.';
    }
  } else if (status?.has_free_tier) {
    const n = daysLeft(status.free_tier_expires_at);
    pill = { label: 'Free trial', className: 'bg-indigo-400/15 text-indigo-200 ring-indigo-300/30' };
    detail = `${n} ${n === 1 ? 'day' : 'days'} left — subscribe to keep access after it ends.`;
    cta = { label: 'Subscribe', busy: 'Redirecting…', onClick: handleSubscribe };
  } else {
    pill = { label: 'No plan', className: 'bg-white/10 text-white/70 ring-white/20' };
    detail = sub?.ended_at ? `Your subscription ended on ${formatDate(sub.ended_at)}.` : "You don't have an active subscription.";
    cta = { label: 'Subscribe', busy: 'Redirecting…', onClick: handleSubscribe };
  }

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0e1428]/80 backdrop-blur-md p-6 sm:p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)]"
    >
      {/* accent gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/20 to-transparent blur-2xl"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white/80">
            <CreditCard className="h-5 w-5 text-indigo-300" />
            <h2 className="text-lg font-semibold text-white">Subscription</h2>
          </div>
          {status && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${pill.className}`}>
              {pill.label}
            </span>
          )}
        </div>

        {!status ? (
          <p className="mt-4 text-sm text-white/50">Loading…</p>
        ) : (
          <>
            <p className="mt-4 flex items-center gap-2 text-sm text-white/70">
              {status.has_free_tier && !status.is_subscribed && <Clock className="h-4 w-4 text-indigo-300" />}
              {detail}
            </p>

            {subDetail && <p className="mt-1 text-xs text-white/40">{subDetail}</p>}

            <button
              type="button"
              onClick={cta.onClick}
              disabled={submitting}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-fuchsia-400 disabled:opacity-60"
            >
              {status.is_subscribed ? <ArrowUpRight className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {submitting ? cta.busy : cta.label}
            </button>

            {status.is_subscribed && (
              <p className="mt-3 text-xs text-white/40">
                Update payment, view invoices, or cancel anytime in the Stripe portal.
              </p>
            )}

            {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
          </>
        )}
      </div>
    </section>
  );
}
