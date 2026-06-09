import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import PremiumGate from './PremiumGate';

const ctx = vi.fn();
vi.mock('../BillingContext', () => ({
  useBilling: () => ctx(),
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/premium"
          element={
            <PremiumGate>
              <div>premium content</div>
            </PremiumGate>
          }
        />
        <Route path="/dashboard/app" element={<div>dashboard home</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('PremiumGate', () => {
  it('renders nothing while loading', () => {
    ctx.mockReturnValue({ status: null, loading: true, openPaywall: vi.fn() });
    const { container } = renderAt('/premium');
    expect(container).toBeEmptyDOMElement();
  });

  it('renders children when entitled', () => {
    ctx.mockReturnValue({
      status: { can_access_premium: true, is_subscribed: true, has_free_tier: false, free_tier_expires_at: '' },
      loading: false,
      openPaywall: vi.fn(),
    });
    renderAt('/premium');
    expect(screen.getByText('premium content')).toBeInTheDocument();
  });

  it('opens paywall and redirects when locked out', () => {
    const openPaywall = vi.fn();
    ctx.mockReturnValue({
      status: { can_access_premium: false, is_subscribed: false, has_free_tier: false, free_tier_expires_at: '' },
      loading: false,
      openPaywall,
    });
    renderAt('/premium');
    expect(openPaywall).toHaveBeenCalledWith('gate');
    expect(screen.getByText('dashboard home')).toBeInTheDocument();
  });
});
