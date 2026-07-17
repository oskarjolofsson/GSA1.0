import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useConnectivity } from 'features/shared/connectivity/ConnectivityContext';
import { pingBackend } from 'features/shared/connectivity/healthService';

export type HealthStatus = 'checking' | 'healthy' | 'unreachable';
export type GateState = 'checking' | 'blocked-offline' | 'blocked-backend' | 'open';

/**
 * Pure gate decision — mirrors `deriveOffline`. Kept pure so it can be unit
 * tested without React. Offline (device signal) always wins over the backend
 * probe; `checking` only surfaces on the first probe (see the hook below).
 */
export function deriveGateState(isOffline: boolean, status: HealthStatus): GateState {
  if (isOffline) return 'blocked-offline';
  if (status === 'unreachable') return 'blocked-backend';
  if (status === 'checking') return 'checking';
  return 'open';
}

/**
 * Owns the backend reachability status. Probes on mount, when the app returns to
 * the foreground, and whenever connectivity flips back online. Re-checks keep the
 * prior status (SWR-style) so only the cold launch shows a spinner — later probes
 * update silently instead of flashing over live content.
 */
export function useBackendHealth() {
  const { isOffline } = useConnectivity();
  const [status, setStatus] = useState<HealthStatus>('checking');

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const revalidate = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const ok = await pingBackend();
      if (mountedRef.current) setStatus(ok ? 'healthy' : 'unreachable');
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Probe on mount and whenever we (re)gain connectivity. When offline the probe
  // is pointless — the gate already blocks on `isOffline` — so we skip it.
  useEffect(() => {
    if (!isOffline) revalidate();
  }, [isOffline, revalidate]);

  // Re-probe when the app returns to the foreground.
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') revalidate();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [revalidate]);

  return { status, revalidate };
}
