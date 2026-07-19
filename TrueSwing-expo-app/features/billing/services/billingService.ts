import apiClient from 'lib/apiClient';
import { routes } from 'lib/api/routes';
import type { BillingStatus } from 'features/billing/types';

/**
 * Read the user's entitlement state across all platforms. Authoritative,
 * cross-platform. Gate UI on `can_access_premium`.
 */
export function getBillingStatus(): Promise<BillingStatus> {
  return apiClient.get<BillingStatus>(routes.billing.status);
}
