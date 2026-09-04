import { useCallback } from 'react';
import { useBilling } from 'features/billing/BillingContext';
import { isPremiumAllowed } from 'features/billing/utils/Gate';

/**
 * Entry-point gate. The app has no route layer to wrap, so premium features call
 * `requirePremium()` on entry. Returns true if allowed; otherwise opens the paywall with
 * reason 'gate' and runs `onDenied`.
 *
 * While status is still loading, entry is allowed optimistically -- the backend 402 and its
 * interceptor are the real enforcement.
 */
export function useRequirePremium() {
  const { status, openPaywall } = useBilling();

  const requirePremium = useCallback(
    (onDenied?: () => void): boolean => {
      if (isPremiumAllowed(status)) return true;

      openPaywall('gate');
      onDenied?.();
      return false;
    },
    [status, openPaywall]
  );

  return {
    canAccessPremium: status?.can_access_premium ?? null,
    requirePremium,
  };
}
