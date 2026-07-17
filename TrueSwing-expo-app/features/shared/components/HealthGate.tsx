import type { PropsWithChildren } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useConnectivity } from 'features/shared/connectivity/ConnectivityContext';
import { deriveGateState, useBackendHealth } from 'features/shared/connectivity/useBackendHealth';
import ErrorState from 'features/shared/components/ErrorState';

/**
 * App-level connectivity gate. Blocks the authed app with a single full-screen
 * state whenever the device is offline or the backend is unreachable, so
 * downstream screens can assume they're online.
 *
 *   deriveGateState(isOffline, backend status)
 *     checking          -> spinner (first probe only)
 *     blocked-offline   -> ErrorState "You're offline"
 *     blocked-backend   -> ErrorState "Can't reach TrueSwing servers"
 *     open              -> children
 */
export default function HealthGate({ children }: PropsWithChildren) {
  const { isOffline } = useConnectivity();
  const { status, revalidate } = useBackendHealth();

  const gate = deriveGateState(isOffline, status);

  if (gate === 'checking') {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (gate === 'blocked-offline') {
    return (
      <ErrorState
        title="You're offline"
        message="Check your internet connection to keep using TrueSwing."
        buttonText="Try again"
        onRetry={revalidate}
      />
    );
  }

  if (gate === 'blocked-backend') {
    return (
      <ErrorState
        title="Can't reach TrueSwing servers"
        message="We couldn't reach the server. This is usually temporary — try again in a moment."
        buttonText="Try again"
        onRetry={revalidate}
      />
    );
  }

  return <>{children}</>;
}
