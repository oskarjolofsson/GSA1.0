import type { BillingStatus } from 'features/billing/types';

/**
 * Pure gate decision. Allows entry when premium is granted, OR when status is
 * still unknown (null) — we don't false-block on a pending fetch; the backend
 * 402 + interceptor is the real enforcement. Blocks only on a known
 * non-entitled status.
 */
export function isPremiumAllowed(status: BillingStatus | null): boolean {
  if (status === null) return true;
  return status.can_access_premium;
}
