import { useBilling } from '../BillingContext';

export function useBillingStatus() {
  const { status, loading, error, refresh } = useBilling();
  return { status, loading, error, refresh };
}
