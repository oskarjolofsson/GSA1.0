import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useRequirePremium } from 'features/billing/hooks/useRequirePremium';

/**
 * Route-focus premium gate. On every focus of a premium entry point, checks
 * access via `requirePremium`; if blocked it pops the paywall and bounces the
 * golfer back to the drawer root (home). Keeps the premium concern in `billing`
 * so route files in `app/` stay logic-free.
 *
 * THIS GATE FIRES ON ROUTE FOCUS, WHICH IS WHY THE ADD-FOCUS FLOWS ARE ROUTES.
 * Opening a drawer does NOT blur the screen underneath it — React Navigation
 * treats the drawer as an overlay on the still-focused route — so a flow moved
 * into `AddFocusDrawer` as inline content would never fire `useFocusEffect`, and
 * a free golfer would walk straight into upload with no paywall, no error and no
 * log. If you are tempted to render one of these flows in the drawer, this is the
 * reason not to.
 */
export function useRequirePremiumEntry() {
  const router = useRouter();
  const { requirePremium } = useRequirePremium();

  useFocusEffect(
    useCallback(() => {
      requirePremium(() => router.replace('/'));
    }, [requirePremium, router])
  );
}
