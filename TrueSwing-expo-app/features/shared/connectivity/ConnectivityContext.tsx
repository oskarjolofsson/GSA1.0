import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

/**
 * App-wide connectivity signal backed by @react-native-community/netinfo.
 *
 * Offline predicate — be conservative so we never flash the banner falsely:
 *   isInternetReachable === false        -> offline (connected but no internet)
 *   isInternetReachable null/unknown     -> fall back to isConnected === false
 *   anything still unknown (launch)      -> treated as ONLINE (no banner flash)
 *
 *   NetInfo event ─► { isConnected, isInternetReachable } ─► derived isOffline
 *                                                              │
 *                                              useConnectivity() / OfflineBanner
 */

type ConnectivityValue = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isOffline: boolean;
};

const ConnectivityContext = createContext<ConnectivityValue | undefined>(undefined);

export function deriveOffline(
  isConnected: boolean | null,
  isInternetReachable: boolean | null
): boolean {
  if (isInternetReachable === false) return true;
  if (isInternetReachable === null) return isConnected === false;
  return false;
}

export function ConnectivityProvider({ children }: PropsWithChildren) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  useEffect(() => {
    const apply = (state: NetInfoState) => {
      setIsConnected(state.isConnected);
      setIsInternetReachable(state.isInternetReachable);
    };

    // Seed with the current state, then subscribe to changes.
    NetInfo.fetch().then(apply);
    const unsubscribe = NetInfo.addEventListener(apply);
    return unsubscribe;
  }, []);

  const value = useMemo<ConnectivityValue>(
    () => ({
      isConnected,
      isInternetReachable,
      isOffline: deriveOffline(isConnected, isInternetReachable),
    }),
    [isConnected, isInternetReachable]
  );

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity(): ConnectivityValue {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) {
    throw new Error('useConnectivity must be used within a ConnectivityProvider');
  }
  return ctx;
}
