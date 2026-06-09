import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PricingPage from './PricingPage';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const billing = vi.fn();
vi.mock('../BillingContext', () => ({
  useBilling: () => billing(),
}));

const auth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => auth(),
}));

const startCheckout = vi.fn();
const openCustomerPortal = vi.fn();
vi.mock('../services/billing', () => ({
  startCheckout: (...a: unknown[]) => startCheckout(...a),
  openCustomerPortal: (...a: unknown[]) => openCustomerPortal(...a),
}));

const wrap = () => render(<MemoryRouter><PricingPage /></MemoryRouter>);

describe('PricingPage', () => {
  beforeEach(() => {
    navigate.mockReset();
    startCheckout.mockReset();
    openCustomerPortal.mockReset();
    sessionStorage.clear();
  });

  it('shows "Sign up to subscribe" for logged-out users', () => {
    billing.mockReturnValue({ status: null, loading: false });
    auth.mockReturnValue({ user: null, loading: false });
    wrap();
    expect(screen.getByRole('button', { name: /sign up to subscribe/i })).toBeInTheDocument();
  });

  it('logged-out CTA sets postLoginRedirect and navigates to sign-in', () => {
    billing.mockReturnValue({ status: null, loading: false });
    auth.mockReturnValue({ user: null, loading: false });
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /sign up to subscribe/i }));
    expect(sessionStorage.getItem('postLoginRedirect')).toBe('/pricing');
    expect(navigate).toHaveBeenCalledWith('/?auth=signin');
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it('logged-in non-subscriber clicks Subscribe and starts checkout', () => {
    billing.mockReturnValue({
      status: { is_subscribed: false, has_free_tier: true, can_access_premium: true, free_tier_expires_at: '' },
      loading: false,
    });
    auth.mockReturnValue({ user: { id: 'u1' }, loading: false });
    startCheckout.mockResolvedValueOnce(undefined);
    wrap();
    fireEvent.click(screen.getByRole('button', { name: /^subscribe$/i }));
    expect(startCheckout).toHaveBeenCalled();
  });

  it('subscribed user sees Manage subscription', () => {
    billing.mockReturnValue({
      status: { is_subscribed: true, has_free_tier: false, can_access_premium: true, free_tier_expires_at: '' },
      loading: false,
    });
    auth.mockReturnValue({ user: { id: 'u1' }, loading: false });
    wrap();
    expect(screen.getByRole('button', { name: /manage subscription/i })).toBeInTheDocument();
  });
});
