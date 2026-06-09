import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { registerPaymentRequiredHandler } from '@/lib/apiClient';
import { getBillingStatus } from './services/billing';
import type { BillingStatus, PaywallReason } from './types';
import PaywallModal from './components/PaywallModal';

const STALE_MS = 45_000;

type Ctx = {
  status: BillingStatus | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
  openPaywall: (reason?: PaywallReason) => void;
  closePaywall: () => void;
};

const BillingCtx = createContext<Ctx | null>(null);

export function BillingProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [paywall, setPaywall] = useState<{ open: boolean; reason: PaywallReason }>({
    open: false,
    reason: 'manual',
  });

  const fetchedAt = useRef(0);
  const inflight = useRef<Promise<void> | null>(null);

  const refresh = useCallback(async () => {
    if (inflight.current) return inflight.current;
    setLoading(true);
    setError(null);
    const p = (async () => {
      try {
        const next = await getBillingStatus();
        setStatus(next);
        fetchedAt.current = Date.now();
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
        inflight.current = null;
      }
    })();
    inflight.current = p;
    return p;
  }, []);

  const invalidate = useCallback(() => {
    fetchedAt.current = 0;
    void refresh();
  }, [refresh]);

  const openPaywall = useCallback((reason: PaywallReason = 'manual') => {
    setPaywall({ open: true, reason });
  }, []);

  const closePaywall = useCallback(() => {
    setPaywall((p) => ({ ...p, open: false }));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const unregister = registerPaymentRequiredHandler((url) => {
      if (url.includes('/billing/')) return;
      invalidate();
      setPaywall({ open: true, reason: '402' });
    });
    return unregister;
  }, [invalidate]);

  useEffect(() => {
    const onFocus = () => {
      if (Date.now() - fetchedAt.current > STALE_MS) void refresh();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({ status, loading, error, refresh, invalidate, openPaywall, closePaywall }),
    [status, loading, error, refresh, invalidate, openPaywall, closePaywall],
  );

  return (
    <BillingCtx.Provider value={value}>
      {children}
      <PaywallModal open={paywall.open} reason={paywall.reason} onClose={closePaywall} />
    </BillingCtx.Provider>
  );
}

export function useBilling() {
  const ctx = useContext(BillingCtx);
  if (!ctx) throw new Error('useBilling must be used within BillingProvider');
  return ctx;
}
