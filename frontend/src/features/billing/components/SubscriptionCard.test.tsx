import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SubscriptionCard from './SubscriptionCard';
import { ApiError } from '@/lib/errors';

const mockStatus = vi.fn();
const invalidate = vi.fn();
vi.mock('../BillingContext', () => ({
  useBilling: () => ({ status: mockStatus(), invalidate }),
}));

const openCustomerPortal = vi.fn();
const startCheckout = vi.fn();
vi.mock('../services/billing', () => ({
  openCustomerPortal: () => openCustomerPortal(),
  startCheckout: () => startCheckout(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  openCustomerPortal.mockResolvedValue(undefined);
  startCheckout.mockResolvedValue(undefined);
});

describe('SubscriptionCard', () => {
  it('shows loading state when status is null', () => {
    mockStatus.mockReturnValue(null);
    render(<SubscriptionCard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('invalidates billing status on mount', () => {
    mockStatus.mockReturnValue(null);
    render(<SubscriptionCard />);
    expect(invalidate).toHaveBeenCalledTimes(1);
  });

  const sub = (over = {}) => ({
    status: 'active',
    current_period_end: '2026-06-30T00:00:00Z',
    cancel_at_period_end: false,
    canceled_at: null,
    ended_at: null,
    ...over,
  });

  it('shows Premium + renewal date when canceled_at is null', () => {
    mockStatus.mockReturnValue({
      is_subscribed: true,
      has_free_tier: false,
      can_access_premium: true,
      free_tier_expires_at: '2030-01-01T00:00:00Z',
      subscription: sub(),
    });
    render(<SubscriptionCard />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText(/Renews/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage subscription/i })).toBeInTheDocument();
  });

  it('shows "plan ends" + "Canceled on" when canceled_at is set (even with cancel_at_period_end false)', () => {
    mockStatus.mockReturnValue({
      is_subscribed: true,
      has_free_tier: false,
      can_access_premium: true,
      free_tier_expires_at: '2030-01-01T00:00:00Z',
      subscription: sub({ cancel_at_period_end: false, canceled_at: '2026-06-09T00:00:00Z' }),
    });
    render(<SubscriptionCard />);
    expect(screen.getByText(/Ending/i)).toBeInTheDocument();
    expect(screen.getByText(/your plan ends .* you keep access until then/i)).toBeInTheDocument();
    expect(screen.getByText(/Canceled on/i)).toBeInTheDocument();
    expect(screen.queryByText(/Renews/i)).not.toBeInTheDocument();
  });

  it('shows a payment-issue state for past_due subscriptions', () => {
    mockStatus.mockReturnValue({
      is_subscribed: true,
      has_free_tier: false,
      can_access_premium: true,
      free_tier_expires_at: '2030-01-01T00:00:00Z',
      subscription: sub({ status: 'past_due' }),
    });
    render(<SubscriptionCard />);
    expect(screen.getByText(/Payment issue/i)).toBeInTheDocument();
    expect(screen.getByText(/could not process your last payment/i)).toBeInTheDocument();
  });

  it('shows No plan + Subscribe once a subscription has fully ended (summary is null)', () => {
    // Backend returns subscription: null once a sub ends (not in ACTIVE statuses),
    // so the churned user sees the generic no-plan state.
    mockStatus.mockReturnValue({
      is_subscribed: false,
      has_free_tier: false,
      can_access_premium: false,
      free_tier_expires_at: '2020-01-01T00:00:00Z',
      subscription: null,
    });
    render(<SubscriptionCard />);
    expect(screen.getByText('No plan')).toBeInTheDocument();
    expect(screen.getByText(/don't have an active subscription/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('shows trial countdown and Subscribe for free tier', () => {
    const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    mockStatus.mockReturnValue({
      is_subscribed: false,
      has_free_tier: true,
      can_access_premium: true,
      free_tier_expires_at: expires,
      subscription: null,
    });
    render(<SubscriptionCard />);
    expect(screen.getByText(/3 days left/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('shows No plan + Subscribe when not subscribed and no trial', () => {
    mockStatus.mockReturnValue({
      is_subscribed: false,
      has_free_tier: false,
      can_access_premium: false,
      free_tier_expires_at: '2020-01-01T00:00:00Z',
      subscription: null,
    });
    render(<SubscriptionCard />);
    expect(screen.getByText('No plan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('opens the portal when Manage is clicked', async () => {
    mockStatus.mockReturnValue({
      is_subscribed: true,
      has_free_tier: false,
      can_access_premium: true,
      free_tier_expires_at: '2030-01-01T00:00:00Z',
      subscription: { status: 'active', current_period_end: null, cancel_at_period_end: false },
    });
    render(<SubscriptionCard />);
    await userEvent.click(screen.getByRole('button', { name: /manage subscription/i }));
    expect(openCustomerPortal).toHaveBeenCalledTimes(1);
  });

  it('falls back to checkout when the portal 404s (no Stripe customer)', async () => {
    openCustomerPortal.mockRejectedValue(new ApiError(404, 'not found'));
    mockStatus.mockReturnValue({
      is_subscribed: true,
      has_free_tier: false,
      can_access_premium: true,
      free_tier_expires_at: '2030-01-01T00:00:00Z',
      subscription: { status: 'active', current_period_end: null, cancel_at_period_end: false },
    });
    render(<SubscriptionCard />);
    await userEvent.click(screen.getByRole('button', { name: /manage subscription/i }));
    await waitFor(() => expect(startCheckout).toHaveBeenCalledTimes(1));
  });

  it('shows an error message when the portal fails non-404', async () => {
    openCustomerPortal.mockRejectedValue(new ApiError(500, 'boom'));
    mockStatus.mockReturnValue({
      is_subscribed: true,
      has_free_tier: false,
      can_access_premium: true,
      free_tier_expires_at: '2030-01-01T00:00:00Z',
      subscription: { status: 'active', current_period_end: null, cancel_at_period_end: false },
    });
    render(<SubscriptionCard />);
    await userEvent.click(screen.getByRole('button', { name: /manage subscription/i }));
    expect(await screen.findByText(/could not open the billing portal/i)).toBeInTheDocument();
    expect(startCheckout).not.toHaveBeenCalled();
  });
});
