import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

/**
 * Leave an add-focus route and return to home, optionally opening the area the
 * golfer just created a focus in.
 *
 * NEVER `replace('/')` ON THE NORMAL PATH, because that is what keeps home alive.
 * The drawer screen sits underneath these routes still mounted, so popping back to
 * it refocuses `HomeFlow` — firing its `useFocusEffect` (refetch) while leaving
 * `selectedArea` intact. A `replace` would rebuild the stack, remount HomeFlow and
 * silently discard the area the golfer had open, undoing the fix documented at
 * `features/home/homeFlow.tsx:38`.
 *
 * `dismissTo` rather than `back` when there is an area: it pops to the same
 * still-mounted home screen, but carries `?area=` so home can open the tab holding
 * the focus that was just created. `back()` cannot pass params.
 *
 * The `canGoBack` guard is for the stackless case: a deep link (the app registers
 * the `trueswing` scheme) or a future notification can open one of these routes
 * cold, with nothing underneath. A bare `back()` there is a no-op and the golfer
 * taps Done to no effect.
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
