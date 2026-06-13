import { useCallback } from 'react';
import { useBilling } from 'features/billing/BillingContext';
import { isPremiumAllowed } from 'features/billing/utils/Gate';

/**
 * Entry-point gate. The app has no route layer to wrap, so premium features
 * call `requirePremium()` when the user tries to enter them (upload tab focus,
 * tapping into drills). Returns true if allowed; otherwise opens the paywall
 * with reason 'gate' and runs `onDenied` (typically: navigate back home).
 *
 * While status is still loading we allow entry optimistically — the backend
 * 402 + interceptor is the real enforcement and will pop the paywall.
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
