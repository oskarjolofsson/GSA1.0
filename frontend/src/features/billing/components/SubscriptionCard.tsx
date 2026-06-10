import { useEffect, useState } from 'react';
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

type Pill = { label: string; dot: string; className: string };

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
      pill = { label: 'Payment issue', dot: 'bg-red-400', className: 'text-red-300' };
      detail = 'We could not process your last payment. Update your card to keep your subscription.';
    } else if (isCanceling) {
      pill = { label: 'Ending', dot: 'bg-amber-400', className: 'text-amber-300' };
      detail = endDate ? `Your plan ends ${endDate} — you keep access until then.` : 'Your plan is set to end and will not renew.';
      subDetail = canceledDate ? `Canceled on ${canceledDate}.` : null;
    } else {
      pill = { label: 'Active', dot: 'bg-emerald-400', className: 'text-emerald-300' };
      detail = endDate ? `Renews ${endDate}.` : 'Your subscription is active.';
    }
  } else if (status?.has_free_tier) {
    const n = daysLeft(status.free_tier_expires_at);
    pill = { label: 'Free trial', dot: 'bg-white/40', className: 'text-white/60' };
    detail = `${n} ${n === 1 ? 'day' : 'days'} left — subscribe to keep access after it ends.`;
    cta = { label: 'Subscribe', busy: 'Redirecting…', onClick: handleSubscribe };
  } else {
    pill = { label: 'No plan', dot: 'bg-white/30', className: 'text-white/50' };
    detail = sub?.ended_at ? `Your subscription ended on ${formatDate(sub.ended_at)}.` : "You don't have an active subscription.";
    cta = { label: 'Subscribe', busy: 'Redirecting…', onClick: handleSubscribe };
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[#0e1428] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Subscription</h2>
        {status && (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${pill.className}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
            {pill.label}
          </span>
        )}
      </div>

      {!status ? (
        <p className="mt-4 text-sm text-white/50">Loading…</p>
      ) : (
        <>
          <p className="mt-3 text-sm text-white/70">{detail}</p>

          {subDetail && <p className="mt-1 text-xs text-white/40">{subDetail}</p>}

          <button
            type="button"
            onClick={cta.onClick}
            disabled={submitting}
            className="mt-6 inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0e1428] transition hover:bg-white/90 disabled:opacity-60"
          >
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
    </section>
  );
}
