/**
 * Behaviour paths only. Colours, spacing and exact copy are deliberately NOT asserted:
 * they belong to the design system and change on their own clock, so pinning them here
 * would just make the next design pass red for no reason.
 *
 * Style note, same as BlockRating.test.tsx: `render` and `fireEvent` are awaited
 * throughout. React 19 renders concurrently and RNTL 14 returns promises from both.
 */
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PaywallModal from './PaywallModal';
import type { PaywallReason } from 'features/billing/types';

// react-native-purchases ships untranspiled ESM via @revenuecat/purchases-js-hybrid-mappings
// and is not in jest-expo's transform allowlist, so it has to be mocked rather than
// imported — same reason and same shape as purchaseService.test.ts.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {},
  PACKAGE_TYPE: {
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    ANNUAL: 'ANNUAL',
  },
}));

jest.mock('features/billing/services/purchaseService');
jest.mock('features/billing/BillingContext', () => ({
  useBilling: jest.fn(),
}));

import { useBilling } from 'features/billing/BillingContext';
import {
  getCurrentOffering,
  purchasePackage,
  restorePurchases,
  hasPremiumEntitlement,
} from 'features/billing/services/purchaseService';

const mockUseBilling = useBilling as jest.Mock;
const mockGetOffering = getCurrentOffering as jest.Mock;
const mockPurchase = purchasePackage as jest.Mock;
const mockRestore = restorePurchases as jest.Mock;
const mockHasEntitlement = hasPremiumEntitlement as jest.Mock;

const MONTHLY = {
  identifier: 'monthly',
  packageType: 'MONTHLY',
  product: { priceString: '199 kr', subscriptionPeriod: 'P1M', title: 'TrueSwing Monthly' },
};
const ANNUAL = {
  identifier: 'annual',
  packageType: 'ANNUAL',
  product: { priceString: '1 690 kr', subscriptionPeriod: 'P1Y', title: 'TrueSwing Annual' },
};

const closePaywall = jest.fn();
const refreshUntilPremium = jest.fn().mockResolvedValue(undefined);

// The paywall pads itself off the notch and the home indicator, so it needs real safe
// area metrics. Supplying them explicitly beats mocking the hook: the padding maths
// stays exercised.
const METRICS = {
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, left: 0, right: 0, bottom: 34 },
};

function renderPaywall() {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PaywallModal />
    </SafeAreaProvider>
  );
}

function billing(reason: PaywallReason = 'manual') {
  mockUseBilling.mockReturnValue({
    paywall: { open: true, reason },
    closePaywall,
    refreshUntilPremium,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  mockGetOffering.mockResolvedValue({ availablePackages: [MONTHLY] });
  billing();
});

describe('the money paths', () => {
  it('closes the paywall and reconciles when the purchase grants entitlement', async () => {
    mockPurchase.mockResolvedValue({});
    mockHasEntitlement.mockReturnValue(true);

    const view = await renderPaywall();
    await waitFor(() => view.getByText('199 kr'));
    await fireEvent.press(view.getByText('Subscribe'));

    await waitFor(() => expect(closePaywall).toHaveBeenCalled());
    expect(refreshUntilPremium).toHaveBeenCalled();
  });

  it('shows NO alert when the golfer cancels the Apple sheet', async () => {
    // The regression this exists to prevent: cancelling is the single most common
    // outcome on a paywall. Treating it as a failure means most people who open this
    // screen get an error popup for doing nothing wrong.
    mockPurchase.mockRejectedValue({ userCancelled: true });

    const view = await renderPaywall();
    await waitFor(() => view.getByText('199 kr'));
    await fireEvent.press(view.getByText('Subscribe'));

    await waitFor(() => expect(mockPurchase).toHaveBeenCalled());
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(closePaywall).not.toHaveBeenCalled();
  });

  it('alerts and stays open when the purchase genuinely fails', async () => {
    mockPurchase.mockRejectedValue({ userCancelled: false, message: 'network' });

    const view = await renderPaywall();
    await waitFor(() => view.getByText('199 kr'));
    await fireEvent.press(view.getByText('Subscribe'));

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Purchase failed', expect.any(String)));
    expect(closePaywall).not.toHaveBeenCalled();
  });
});

describe('restore', () => {
  it('closes the paywall when a previous purchase is found', async () => {
    mockRestore.mockResolvedValue({});
    mockHasEntitlement.mockReturnValue(true);

    const view = await renderPaywall();
    await fireEvent.press(view.getByText('Restore purchases'));

    await waitFor(() => expect(closePaywall).toHaveBeenCalled());
  });

  it('tells the golfer when there is nothing to restore', async () => {
    mockRestore.mockResolvedValue({});
    mockHasEntitlement.mockReturnValue(false);

    const view = await renderPaywall();
    await fireEvent.press(view.getByText('Restore purchases'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Nothing to restore', expect.any(String))
    );
    expect(closePaywall).not.toHaveBeenCalled();
  });

  it('alerts when the restore call throws', async () => {
    mockRestore.mockRejectedValue(new Error('offline'));

    const view = await renderPaywall();
    await fireEvent.press(view.getByText('Restore purchases'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Restore failed', expect.any(String))
    );
  });
});

describe('render states', () => {
  it('disables the CTA while the offering is loading, and says so to a screen reader', async () => {
    mockGetOffering.mockReturnValue(new Promise(() => {})); // never resolves

    const view = await renderPaywall();
    const cta = view.getByText('Subscribe').parent;

    expect(view.getByText('Subscribe')).toBeTruthy();
    await waitFor(() =>
      expect(view.getByRole('button', { name: /subscribe/i }).props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true })
      )
    );
    expect(cta).toBeTruthy();
  });

  it('offers a retry when the offering fails, and keeps restore reachable', async () => {
    // A subscriber who reinstalled with no signal must never be trapped: restore is
    // their only way back in, so it stays tappable even when prices cannot load.
    mockGetOffering.mockRejectedValue(new Error('offline'));

    const view = await renderPaywall();

    await waitFor(() => view.getByText('Try again'));
    expect(view.getByText('Restore purchases')).toBeTruthy();
    expect(view.queryByText('Subscribe')).toBeNull();
  });

  it('refetches the offering when Try again is pressed', async () => {
    mockGetOffering.mockRejectedValueOnce(new Error('offline'));

    const view = await renderPaywall();
    await waitFor(() => view.getByText('Try again'));

    mockGetOffering.mockResolvedValue({ availablePackages: [MONTHLY] });
    await fireEvent.press(view.getByText('Try again'));

    await waitFor(() => expect(view.getByText('199 kr')).toBeTruthy());
  });

  it('never hides a second package', async () => {
    // The bug this prevents: availablePackages[0] silently drops an annual tier added
    // in the RevenueCat dashboard. No error, no log — you would find out from a revenue
    // chart, not a bug report.
    mockGetOffering.mockResolvedValue({ availablePackages: [MONTHLY, ANNUAL] });

    const view = await renderPaywall();

    await waitFor(() => view.getByText('1 690 kr'));
    expect(view.getByText('199 kr')).toBeTruthy();
  });
});

describe('reason routing', () => {
  it.each(['manual', 'gate'] as PaywallReason[])(
    'shows the value set for reason %s',
    async (reason) => {
      billing(reason);
      const view = await renderPaywall();
      expect(view.getByText('Film a swing, get it analysed')).toBeTruthy();
    }
  );

  it('hides the value set on 402 and explains what happened instead', async () => {
    // Someone whose access just died mid-practice does not need a feature list. They
    // need to know nothing was charged and their work is still there.
    billing('402');
    const view = await renderPaywall();

    expect(view.queryByText('Film a swing, get it analysed')).toBeNull();
    expect(view.getByText(/Nothing has been charged/)).toBeTruthy();
  });
});
