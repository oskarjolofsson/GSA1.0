import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useBilling } from '../BillingContext';
import { startCheckout, openCustomerPortal } from '../services/billing';

// TODO: replace placeholder copy + price with final marketing content.
const BENEFITS = [
  'Unlimited uploads and analyses',
  'Personalized drill recommendations',
  'Full session history and progress tracking',
  'Priority support',
];

const PLACEHOLDER_PRICE = '$X / month';

export default function PricingPage() {
  const { status, loading } = useBilling();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = status?.is_subscribed ?? false;

  const handleClick = async () => {
    setSubmitting(true);
    setError(null);
    try {
      if (isSubscribed) await openCustomerPortal();
      else await startCheckout();
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-16">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
        <Sparkles size={14} />
        Premium
      </div>
      {/* TODO: final headline + subhead */}
      <h1 className="text-center text-3xl font-semibold text-neutral-900 sm:text-4xl">
        Get more out of your practice
      </h1>
      <p className="mt-3 max-w-xl text-center text-neutral-500">
        Subscribe to unlock the tools that help you analyze, drill, and improve faster.
      </p>

      <div className="mt-10 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-neutral-900">{PLACEHOLDER_PRICE}</span>
          <span className="text-sm text-neutral-500">billed monthly</span>
        </div>

        <ul className="mt-6 space-y-3">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-neutral-700">
              <Check size={16} className="mt-0.5 flex-shrink-0 text-indigo-600" />
              {b}
            </li>
          ))}
        </ul>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleClick}
          disabled={submitting || loading}
          className="mt-7 w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting
            ? 'Redirecting…'
            : isSubscribed
              ? 'Manage subscription'
              : 'Subscribe'}
        </button>

        {isSubscribed && (
          <p className="mt-3 text-center text-xs text-neutral-500">
            You're already subscribed. Manage your plan in the Stripe portal.
          </p>
        )}
      </div>
    </div>
  );
}
