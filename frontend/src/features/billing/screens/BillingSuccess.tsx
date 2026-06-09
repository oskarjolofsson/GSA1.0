import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useBilling } from '../BillingContext';

const POLL_MS = 1000;
const MAX_ATTEMPTS = 10;

export default function BillingSuccess() {
  const { status, refresh, invalidate } = useBilling();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState(0);
  const [givenUp, setGivenUp] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    if (status?.is_subscribed) {
      const t = setTimeout(() => navigate('/dashboard/app'), 1500);
      return () => clearTimeout(t);
    }
    if (givenUp) return;
    if (attempts >= MAX_ATTEMPTS) {
      setGivenUp(true);
      return;
    }
    timer.current = setTimeout(() => {
      void refresh();
      setAttempts((n) => n + 1);
    }, POLL_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [status, attempts, givenUp, refresh, navigate]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      {status?.is_subscribed ? (
        <>
          <CheckCircle2 size={56} className="text-emerald-500" />
          <h1 className="mt-5 text-2xl font-semibold text-neutral-900">You're subscribed</h1>
          <p className="mt-2 text-neutral-500">Redirecting you to your dashboard…</p>
        </>
      ) : givenUp ? (
        <>
          <h1 className="text-2xl font-semibold text-neutral-900">Still processing</h1>
          <p className="mt-2 text-neutral-500">
            Stripe is finalizing your subscription. Refresh in a moment, or head back to your
            dashboard — your access will activate as soon as it's done.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setGivenUp(false);
                setAttempts(0);
                void refresh();
              }}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Retry
            </button>
            <Link
              to="/dashboard/app"
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Go to dashboard
            </Link>
          </div>
        </>
      ) : (
        <>
          <Loader2 size={40} className="animate-spin text-indigo-600" />
          <h1 className="mt-5 text-2xl font-semibold text-neutral-900">Activating your subscription</h1>
          <p className="mt-2 text-neutral-500">This usually takes a second or two…</p>
        </>
      )}
    </div>
  );
}
