import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import SubscriptionBanner from './SubscriptionBanner';

const mockStatus = vi.fn();
vi.mock('../BillingContext', () => ({
  useBilling: () => ({ status: mockStatus() }),
}));

const wrap = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('SubscriptionBanner', () => {
  it('renders nothing when subscribed', () => {
    mockStatus.mockReturnValue({
      is_subscribed: true,
      has_free_tier: false,
      can_access_premium: true,
      free_tier_expires_at: '2030-01-01T00:00:00Z',
    });
    const { container } = wrap(<SubscriptionBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows day countdown on free tier', () => {
    const expires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    mockStatus.mockReturnValue({
      is_subscribed: false,
      has_free_tier: true,
      can_access_premium: true,
      free_tier_expires_at: expires,
    });
    wrap(<SubscriptionBanner />);
    expect(screen.getByText(/3 days left/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /upgrade/i })).toHaveAttribute('href', '/pricing');
  });

  it('shows trial-ended banner when not subscribed and free tier expired', () => {
    mockStatus.mockReturnValue({
      is_subscribed: false,
      has_free_tier: false,
      can_access_premium: false,
      free_tier_expires_at: '2020-01-01T00:00:00Z',
    });
    wrap(<SubscriptionBanner />);
    expect(screen.getByText(/free trial has ended/i)).toBeInTheDocument();
  });
});
