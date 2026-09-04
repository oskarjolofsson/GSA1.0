import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/**
 * Leave an add-focus route and return to home, optionally opening the area the golfer just
 * created a focus in.
 *
 * Never `replace('/')` on the normal path: home sits underneath still mounted, so popping
 * back refocuses `HomeFlow` and leaves `selectedArea` intact, while a replace would remount
 * it and discard the open area (ADR-0023). `dismissTo` rather than `back` when there is an
 * area, because `back()` cannot pass params.
 *
 * The `canGoBack` guard is for the stackless case: a deep link can open one of these routes
 * cold, with nothing underneath, where a bare `back()` is a no-op.
 */
export function exitToHome(router: Router, areaKey?: string | null): void {
  if (!router.canGoBack()) {
    router.replace(areaKey ? `/?area=${areaKey}` : '/');
    return;
  }

  if (areaKey) {
    router.dismissTo(`/?area=${areaKey}`);
    return;
  }

  router.back();
}
