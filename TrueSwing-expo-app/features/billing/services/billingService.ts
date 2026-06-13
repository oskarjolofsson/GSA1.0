import apiClient from 'lib/apiClient';
import type { BillingStatus } from 'features/billing/types';

/**
 * Read the user's entitlement state across all platforms. Authoritative,
 * cross-platform. Gate UI on `can_access_premium`.
 */
export function getBillingStatus(): Promise<BillingStatus> {
  return apiClient.get<BillingStatus>('/api/v1/billing/status');
}
