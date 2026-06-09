import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBilling } from '../BillingContext';
import { startCheckout, openCustomerPortal } from '../services/billing';

// TODO: replace placeholder copy + price with final marketing content.
const BENEFITS = [
  'Unlimited uploads and analyses',
  'Personalized drill recommendations',
  'Full session history and progress tracking',
  'Priority support',
];

const PLACEHOLDER_PRICE = '€9';

export default function PricingPage() {
  const { status, loading } = useBilling();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = status?.is_subscribed ?? false;
  const isLoggedOut = !authLoading && !user;

  const ctaLabel = submitting
    ? 'Redirecting…'
    : isLoggedOut
      ? 'Sign up to subscribe'
      : isSubscribed
        ? 'Manage subscription'
        : 'Subscribe';

  const handleClick = async () => {
    if (isLoggedOut) {
      sessionStorage.setItem('postLoginRedirect', '/pricing');
      navigate('/?auth=signin');
      return;
    }
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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 pt-28 pb-20">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[140px]" />

      {/* <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur">
        <Sparkles size={14} />
        Premium
      </div> */}

      {/* TODO: final headline + subhead */}
      <h1 className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        Get more out of your practice
      </h1>
      <p className="mt-3 max-w-xl text-center text-slate-400">
        Subscribe to unlock the tools that help you analyze, drill, and improve faster.
      </p>

      <div className="relative mt-10 w-full max-w-md">
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/30 to-indigo-500/60 opacity-80 blur-sm" />
        <div className="relative rounded-3xl border border-white/10 bg-[#0f1530]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className=''>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-300/80">Premium</p>
              <div className="mt-2 flex items-center justify-center gap-2 w-full">
                <span className="text-4xl font-semibold text-white">{PLACEHOLDER_PRICE}</span>
                <span className="text-sm text-slate-400">/ month</span>
              </div>
            </div>
          </div>

          <div className="my-7 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <ul className="space-y-3.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-slate-200">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/15 ring-1 ring-inset ring-indigo-400/30">
                  <Check size={12} className="text-indigo-300" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          {error && <p className="mt-5 text-sm text-red-400">{error}</p>}

          <button
            type="button"
            onClick={handleClick}
            disabled={submitting || (loading && !isLoggedOut) || authLoading}
            className="mt-8 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-60"
          >
            {ctaLabel}
          </button>

          {isSubscribed && (
            <p className="mt-3 text-center text-xs text-slate-400">
              You're already subscribed. Manage your plan in the Stripe portal.
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500">Cancel anytime · Secure checkout via Stripe</p>
    </div>
  );
}
