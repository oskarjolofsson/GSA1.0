import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useRequirePremium } from 'features/billing/hooks/useRequirePremium';

/**
 * Route-focus premium gate. On every focus of a premium entry point, checks
 * access via `requirePremium`; if blocked it pops the paywall and bounces the
 * user back to the home tab. Keeps the premium concern in `billing` so route
 * files in `app/` stay logic-free.
 */
export function useRequirePremiumEntry() {
  const router = useRouter();
  const { requirePremium } = useRequirePremium();

  useFocusEffect(
    useCallback(() => {
      requirePremium(() => router.replace('/(app)/(tabs)'));
    }, [requirePremium, router])
  );
}
