import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useBilling } from '../BillingContext';

type Props = { children: ReactNode };

/**
 * Wraps a route element. If the user can't access premium, opens the paywall
 * and bounces to /dashboard/app. While status is loading, renders nothing
 * (parent layouts handle the shell). The apiClient 402 interceptor is a
 * second line of defense in case a feature slips past this gate.
 */
export default function PremiumGate({ children }: Props) {
  const { status, loading, openPaywall } = useBilling();

  useEffect(() => {
    if (!loading && status && !status.can_access_premium) {
      openPaywall('gate');
    }
  }, [loading, status, openPaywall]);

  if (loading || !status) return null;
  if (!status.can_access_premium) return <Navigate to="/dashboard/app" replace />;
  return <>{children}</>;
}
