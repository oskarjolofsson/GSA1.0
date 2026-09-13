import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useBilling } from 'features/billing/BillingContext';
import { useRequirePremium } from 'features/billing/hooks/useRequirePremium';

/**
 * Route-focus premium gate: on every focus of a premium entry point, check access and, if
 * blocked, pop the paywall and bounce back to home.
 *
 * It fires on ROUTE focus, which is why the add-focus flows are routes. React Navigation
 * treats a drawer as an overlay on the still-focused route, so a flow rendered inside
 * `AddFocusDrawer` would never fire `useFocusEffect` and a free golfer would walk straight
 * into upload with no paywall, no error and no log.
 */
export function useRequirePremiumEntry() {
  const router = useRouter();
  const { invalidate } = useBilling();
  const { requirePremium } = useRequirePremium();

  const requirePremiumRef = useRef(requirePremium);
  useEffect(() => {
    requirePremiumRef.current = requirePremium;
  }, [requirePremium]);

  useFocusEffect(
    useCallback(() => {
      invalidate();
      requirePremiumRef.current(() => router.replace('/'));
    }, [invalidate, router])
  );
}
