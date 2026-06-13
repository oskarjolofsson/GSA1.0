import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { registerPaymentRequiredHandler } from 'lib/apiClient';
import { useAuth } from 'features/auth/AuthProvider';
import { getBillingStatus } from 'features/billing/services/billingService';
import PaywallModal from 'features/billing/components/PaywallModal';
import type { BillingStatus, PaywallReason } from 'features/billing/types';

// Treat status older than this as stale and refetch on app foreground.
const STALE_MS = 45_000;
// After a purchase, poll until the backend webhook flips is_subscribed.
const POLL_INTERVAL_MS = 1_000;
const POLL_MAX_ATTEMPTS = 8;

type PaywallState = { open: boolean; reason: PaywallReason };

type BillingContextValue = {
  status: BillingStatus | null;
  loading: boolean;
  error: string | null;
  paywall: PaywallState;
  refresh: () => Promise<void>;
  invalidate: () => void;
  openPaywall: (reason: PaywallReason) => void;
  closePaywall: () => void;
  /** Poll status until premium unlocks (post-purchase reconciliation). */
  refreshUntilPremium: () => Promise<void>;
};

const BillingContext = createContext<BillingContextValue | undefined>(undefined);

export function BillingProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<PaywallState>({ open: false, reason: 'manual' });

  const inflight = useRef<Promise<void> | null>(null);
  const lastFetched = useRef(0);

  const refresh = useCallback(async () => {
    // Dedupe concurrent callers onto a single in-flight request.
    if (inflight.current) return inflight.current;

    const run = (async () => {
      setLoading(true);
      try {
        const next = await getBillingStatus();
        // TEMP DIAGNOSTIC — remove once cross-platform sub is confirmed.
        console.log('[billing] status:', JSON.stringify(next));
        setStatus(next);
        setError(null);
        lastFetched.current = Date.now();
      } catch (e) {
        if (e instanceof Error && e.message === 'Not signed in') {
          setStatus(null); // expected pre-auth; surface no error (web parity)
        } else {
          setError(e instanceof Error ? e.message : 'Failed to load billing status');
        }
      } finally {
        setLoading(false);
        inflight.current = null;
      }
    })();

    inflight.current = run;
    return run;
  }, []);

  const invalidate = useCallback(() => {
    lastFetched.current = 0;
    void refresh();
  }, [refresh]);

  const refreshUntilPremium = useCallback(async () => {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await refresh();
      if (inflight.current) await inflight.current;
      // Re-read latest by fetching directly to avoid stale closure on `status`.
      try {
        const latest = await getBillingStatus();
        setStatus(latest);
        if (latest.can_access_premium) return;
      } catch {
        // keep polling; transient
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }, [refresh]);

  const openPaywall = useCallback((reason: PaywallReason) => {
    // TEMP DIAGNOSTIC — remove once paywall behavior is confirmed.
    console.log('[billing] openPaywall called, reason:', reason, new Error().stack);
    setPaywall({ open: true, reason });
  }, []);

  const closePaywall = useCallback(() => {
    setPaywall((p) => ({ ...p, open: false }));
  }, []);

  // Fetch on auth, clear on sign-out.
  useEffect(() => {
    if (session) void refresh();
    else setStatus(null);
  }, [session, refresh]);

  // Refresh on app foreground, but only if the cached status is stale.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && session && Date.now() - lastFetched.current > STALE_MS) {
        void refresh();
      }
    });
    return () => sub.remove();
  }, [session, refresh]);

  // 402 backstop: any premium call that gets Payment Required pops the paywall.
  useEffect(() => {
    registerPaymentRequiredHandler(() => {
      invalidate();
      openPaywall('402');
    });
    return () => registerPaymentRequiredHandler(null);
  }, [invalidate, openPaywall]);

  const value = useMemo<BillingContextValue>(
    () => ({
      status,
      loading,
      error,
      paywall,
      refresh,
      invalidate,
      openPaywall,
      closePaywall,
      refreshUntilPremium,
    }),
    [status, loading, error, paywall, refresh, invalidate, openPaywall, closePaywall, refreshUntilPremium]
  );

  return (
    <BillingContext.Provider value={value}>
      {children}
      <PaywallModal />
    </BillingContext.Provider>
  );
}

export function useBilling(): BillingContextValue {
  const ctx = useContext(BillingContext);
  if (!ctx) throw new Error('useBilling must be used within a BillingProvider');
  return ctx;
}
