/**
 * Regression guard for the admin-comp staleness bug: granting a subscription outside
 * the in-app purchase flow (e.g. an admin dashboard) never touched BillingContext's
 * cache, so a premium entry point kept gating on a stale `can_access_premium: false`
 * until the app happened to background/foreground past the 45s staleness window.
 * `useRequirePremiumEntry` now invalidates on every focus, same as SubscriptionCard
 * does on mount, so the *next* focus attempt always sees a fresh grant.
 *
 * Also guards the loop this introduced: `invalidate()` updates `status`, which changes
 * `requirePremium`'s identity (it's a useCallback keyed on `status`). If the effect
 * passed to useFocusEffect depended on `requirePremium` directly, its own identity would
 * churn every time status updated, and real `useFocusEffect` re-invokes on callback
 * identity change while focused -- not just on real navigation focus -- so it would
 * invalidate forever while a screen just sat there (e.g. the camera). The mock below
 * reproduces that identity-change re-invocation (unlike a real navigator, it isn't
 * itself under test here) so this suite catches a regression back to depending on
 * `requirePremium` directly.
 */
import { renderHook } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  let lastCallback: (() => void) | undefined;
  return {
    useRouter: jest.fn(),
    // Mirrors real useFocusEffect: only re-invokes when the callback reference changes
    // (as it would on a real focus event), not on every render.
    useFocusEffect: (cb: () => void) => {
      if (cb !== lastCallback) {
        lastCallback = cb;
        cb();
      }
    },
  };
});
jest.mock('features/billing/BillingContext', () => ({
  useBilling: jest.fn(),
}));
jest.mock('features/billing/hooks/useRequirePremium', () => ({
  useRequirePremium: jest.fn(),
}));

import { useRouter } from 'expo-router';
import { useBilling } from 'features/billing/BillingContext';
import { useRequirePremium } from 'features/billing/hooks/useRequirePremium';
import { useRequirePremiumEntry } from './useRequirePremiumEntry';

const mockUseRouter = useRouter as jest.Mock;
const mockUseBilling = useBilling as jest.Mock;
const mockUseRequirePremium = useRequirePremium as jest.Mock;

describe('useRequirePremiumEntry', () => {
  let invalidate: jest.Mock;
  let requirePremium: jest.Mock;
  let replace: jest.Mock;

  beforeEach(() => {
    invalidate = jest.fn();
    requirePremium = jest.fn();
    replace = jest.fn();
    mockUseRouter.mockReturnValue({ replace });
    mockUseBilling.mockReturnValue({ invalidate });
    mockUseRequirePremium.mockReturnValue({ requirePremium });
  });

  it('invalidates billing status on every focus', async () => {
    await renderHook(() => useRequirePremiumEntry());

    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  it('still gates on the current (possibly stale) status this focus, optimistically', async () => {
    await renderHook(() => useRequirePremiumEntry());

    expect(requirePremium).toHaveBeenCalledTimes(1);
    expect(requirePremium).toHaveBeenCalledWith(expect.any(Function));
  });

  it('bounces home via router.replace when requirePremium denies entry', async () => {
    await renderHook(() => useRequirePremiumEntry());

    const onDenied = requirePremium.mock.calls[0][0];
    onDenied();

    expect(replace).toHaveBeenCalledWith('/');
  });

  it('does not re-invalidate when requirePremium changes identity without a real re-focus', async () => {
    const { rerender } = await renderHook(() => useRequirePremiumEntry());
    expect(invalidate).toHaveBeenCalledTimes(1);

    // Simulate a status update giving useRequirePremium a new requirePremium identity --
    // exactly what invalidate() itself causes -- without any real navigation focus event.
    mockUseRequirePremium.mockReturnValue({ requirePremium: jest.fn() });
    await rerender({});

    expect(invalidate).toHaveBeenCalledTimes(1);
  });
});
