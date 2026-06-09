import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useBilling } from '../BillingContext';

const POLL_MS = 1000;
const MAX_ATTEMPTS = 15;
const REDIRECT_DELAY_MS = 1500;

type View = 'polling' | 'success' | 'timeout' | 'error';

export default function BillingSuccess() {
  const { status, error, refresh, invalidate } = useBilling();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState(0);
  const [givenUp, setGivenUp] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    invalidate();
  }, [invalidate]);

  useEffect(() => {
    if (status?.is_subscribed) {
      const t = setTimeout(() => navigate('/dashboard/app'), REDIRECT_DELAY_MS);
      return () => clearTimeout(t);
    }
    if (givenUp || error) return;
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
  }, [status, attempts, givenUp, error, refresh, navigate]);

  const view: View = status?.is_subscribed
    ? 'success'
    : error
      ? 'error'
      : givenUp
        ? 'timeout'
        : 'polling';

  const handleRetry = () => {
    setGivenUp(false);
    setAttempts(0);
    invalidate();
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 pt-28 pb-20">
      <div
        className={`pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[480px] w-[480px] -translate-x-1/2 rounded-full blur-[140px] transition-colors duration-500 ${
          view === 'success'
            ? 'bg-emerald-500/20'
            : view === 'error'
              ? 'bg-red-500/20'
              : view === 'timeout'
                ? 'bg-amber-500/20'
                : 'bg-indigo-500/20'
        }`}
      />

      <div className="relative w-full max-w-md">
        <div
          className={`absolute -inset-px rounded-3xl bg-gradient-to-br opacity-80 blur-sm ${
            view === 'success'
              ? 'from-emerald-500/60 via-emerald-400/30 to-emerald-500/60'
              : view === 'error'
                ? 'from-red-500/60 via-red-400/30 to-red-500/60'
                : view === 'timeout'
                  ? 'from-amber-500/60 via-amber-400/30 to-amber-500/60'
                  : 'from-indigo-500/60 via-fuchsia-500/30 to-indigo-500/60'
          }`}
        />
        <div className="relative rounded-3xl border border-white/10 bg-[#0f1530]/90 p-10 text-center shadow-2xl backdrop-blur-xl">
          {view === 'success' && <SuccessState />}
          {view === 'polling' && <PollingState attempts={attempts} max={MAX_ATTEMPTS} />}
          {view === 'timeout' && <TimeoutState onRetry={handleRetry} />}
          {view === 'error' && <ErrorState error={error} onRetry={handleRetry} />}
        </div>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <>
      <Badge tone="emerald">
        <CheckCircle2 size={32} />
      </Badge>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">You're subscribed</h1>
      <p className="mt-2 text-sm text-slate-400">Redirecting you to your dashboard…</p>
    </>
  );
}

function PollingState({ attempts, max }: { attempts: number; max: number }) {
  return (
    <>
      <Badge tone="indigo">
        <Loader2 size={32} className="animate-spin" />
      </Badge>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
        Activating your subscription
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        We're confirming your payment with Stripe. This usually takes a second or two.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
        Checking with Stripe… {Math.min(attempts + 1, max)} / {max}
      </div>
    </>
  );
}

function TimeoutState({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <Badge tone="amber">
        <Clock size={32} />
      </Badge>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">Still processing</h1>
      <p className="mt-2 text-sm text-slate-400">
        Stripe is taking longer than usual to confirm your subscription. Your access will activate
        automatically when it's done — refresh in a moment, or head back to your dashboard.
      </p>
      <Actions onRetry={onRetry} retryLabel="Check again" />
    </>
  );
}

function ErrorState({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return (
    <>
      <Badge tone="red">
        <AlertTriangle size={32} />
      </Badge>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-white">
        Couldn't verify your subscription
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Something went wrong on our side while checking with Stripe. Your payment is safe — try
        again in a moment, or contact us if it keeps failing.
      </p>
      {error?.message && (
        <p className="mt-3 break-words rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-xs text-slate-500">
          {error.message}
        </p>
      )}
      <Actions
        onRetry={onRetry}
        retryLabel="Try again"
        extra={
          <a
            href="mailto:trueswing25@gmail.com"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
          >
            Contact support
          </a>
        }
      />
    </>
  );
}

function Actions({
  onRetry,
  retryLabel,
  extra,
}: {
  onRetry: () => void;
  retryLabel: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/40 transition hover:from-indigo-400 hover:to-indigo-500"
      >
        {retryLabel}
      </button>
      {extra}
      <Link
        to="/dashboard/app"
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10"
      >
        Go to dashboard
      </Link>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: 'indigo' | 'emerald' | 'amber' | 'red';
  children: React.ReactNode;
}) {
  const ring = {
    indigo: 'bg-indigo-500/15 text-indigo-300 ring-indigo-400/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
    amber: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
    red: 'bg-red-500/15 text-red-300 ring-red-400/30',
  }[tone];
  return (
    <span
      className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ring-inset ${ring}`}
    >
      {children}
    </span>
  );
}
