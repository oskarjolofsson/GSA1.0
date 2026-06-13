import { isPremiumAllowed } from 'features/billing/utils/Gate';
import type { BillingStatus } from 'features/billing/types';

function status(canAccess: boolean): BillingStatus {
  return {
    is_subscribed: canAccess,
    has_free_tier: false,
    can_access_premium: canAccess,
    free_tier_expires_at: '2026-06-20T00:00:00Z',
    subscription: null,
  };
}

describe('isPremiumAllowed', () => {
  it('allows when premium is granted', () => {
    expect(isPremiumAllowed(status(true))).toBe(true);
  });

  it('blocks when status is known and not entitled', () => {
    expect(isPremiumAllowed(status(false))).toBe(false);
  });

  it('allows optimistically while status is unknown (null)', () => {
    expect(isPremiumAllowed(null)).toBe(true);
  });
});
