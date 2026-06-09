import { fetchWithAuth } from '@/lib/apiClient';
import type { BillingStatus } from '../types';

export function getBillingStatus(): Promise<BillingStatus> {
  return fetchWithAuth<BillingStatus>('/api/v1/billing/status', 'GET');
}

export async function startCheckout(): Promise<void> {
  const { checkout_url } = await fetchWithAuth<{ checkout_url: string }>(
    '/api/v1/billing/checkout-session/',
    'POST',
  );
  window.location.href = checkout_url;
}

export async function openCustomerPortal(): Promise<void> {
  const { portal_url } = await fetchWithAuth<{ portal_url: string }>(
    '/api/v1/billing/portal/',
    'GET',
  );
  window.location.href = portal_url;
}
