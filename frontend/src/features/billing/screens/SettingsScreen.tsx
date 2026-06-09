import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/errors';
import { useBilling } from '../BillingContext';
import { openCustomerPortal, startCheckout } from '../services/billing';

export default function SettingsScreen() {
  const { status, invalidate } = useBilling();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  const handlePortal = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await openCustomerPortal();
    } catch (e) {
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">Subscription</h2>

        {!status ? (
          <p className="mt-4 text-sm text-neutral-500">Loading…</p>
        ) : status.is_subscribed ? (
          <>
            <p className="mt-3 text-neutral-700">
              You're on the <strong>Premium</strong> plan.
            </p>
            <button
              type="button"
              onClick={handlePortal}
              disabled={submitting}
              className="mt-5 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {submitting ? 'Opening…' : 'Manage subscription'}
            </button>
            <p className="mt-2 text-xs text-neutral-500">
              Update payment, view invoices, or cancel anytime in the Stripe portal.
            </p>
          </>
        ) : status.has_free_tier ? (
          <>
            <p className="mt-3 text-neutral-700">
              You're on the <strong>free trial</strong>. Subscribe to keep access after it ends.
            </p>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={submitting}
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Redirecting…' : 'Subscribe'}
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-neutral-700">
              You don't have an active subscription.
            </p>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={submitting}
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Redirecting…' : 'Subscribe'}
            </button>
          </>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </section>
    </div>
  );
}
