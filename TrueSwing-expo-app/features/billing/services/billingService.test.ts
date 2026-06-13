import { getBillingStatus } from 'features/billing/services/billingService';
import apiClient from 'lib/apiClient';
import type { BillingStatus } from 'features/billing/types';

jest.mock('lib/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockGet = apiClient.get as jest.Mock;

describe('getBillingStatus', () => {
  afterEach(() => jest.clearAllMocks());

  it('calls the billing status endpoint and returns the payload', async () => {
    const status: BillingStatus = {
      is_subscribed: true,
      has_free_tier: false,
      can_access_premium: true,
      free_tier_expires_at: '2026-06-18T10:00:00+00:00',
      subscription: {
        provider: 'revenuecat',
        status: 'active',
        current_period_end: '2026-07-10T10:00:00+00:00',
        cancel_at_period_end: false,
        canceled_at: null,
        ended_at: null,
      },
    };
    mockGet.mockResolvedValue(status);

    const result = await getBillingStatus();

    expect(mockGet).toHaveBeenCalledWith('/api/v1/billing/status');
    expect(result).toEqual(status);
  });
});
