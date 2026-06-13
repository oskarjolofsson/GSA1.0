import type { CustomerInfo } from 'react-native-purchases';

const mockPurchasePackage = jest.fn();
const mockRestore = jest.fn();
const mockGetOfferings = jest.fn();
const mockLogIn = jest.fn();
const mockLogOut = jest.fn();
const mockConfigure = jest.fn();

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: (...a: unknown[]) => mockConfigure(...a),
    logIn: (...a: unknown[]) => mockLogIn(...a),
    logOut: (...a: unknown[]) => mockLogOut(...a),
    getOfferings: (...a: unknown[]) => mockGetOfferings(...a),
    purchasePackage: (...a: unknown[]) => mockPurchasePackage(...a),
    restorePurchases: (...a: unknown[]) => mockRestore(...a),
  },
}));

import {
  purchasePackage,
  restorePurchases,
  hasPremiumEntitlement,
  getCurrentOffering,
} from 'features/billing/services/purchaseService';

function customerInfo(active: boolean): CustomerInfo {
  return {
    entitlements: { active: active ? { premium: {} } : {} },
  } as unknown as CustomerInfo;
}

describe('purchaseService', () => {
  afterEach(() => jest.clearAllMocks());

  it('purchasePackage returns the fresh customerInfo', async () => {
    mockPurchasePackage.mockResolvedValue({ customerInfo: customerInfo(true) });
    const info = await purchasePackage({} as any);
    expect(hasPremiumEntitlement(info)).toBe(true);
  });

  it('hasPremiumEntitlement is false without the premium entitlement', () => {
    expect(hasPremiumEntitlement(customerInfo(false))).toBe(false);
  });

  it('restorePurchases returns customerInfo', async () => {
    mockRestore.mockResolvedValue(customerInfo(false));
    const info = await restorePurchases();
    expect(hasPremiumEntitlement(info)).toBe(false);
  });

  it('getCurrentOffering returns null when there is no current offering', async () => {
    mockGetOfferings.mockResolvedValue({ current: null });
    expect(await getCurrentOffering()).toBeNull();
  });
});
