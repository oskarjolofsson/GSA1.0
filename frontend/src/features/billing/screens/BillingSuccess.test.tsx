import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import BillingSuccess from './BillingSuccess';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const ctx = vi.fn();
vi.mock('../BillingContext', () => ({
  useBilling: () => ctx(),
}));

describe('BillingSuccess', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigate.mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows loading while not yet subscribed and polls', async () => {
    const refresh = vi.fn();
    ctx.mockReturnValue({
      status: { is_subscribed: false, has_free_tier: false, can_access_premium: false, free_tier_expires_at: '' },
      error: null,
      refresh,
      invalidate: vi.fn(),
    });
    render(<MemoryRouter><BillingSuccess /></MemoryRouter>);
    expect(screen.getByText(/activating/i)).toBeInTheDocument();
    expect(screen.getByText(/checking with stripe/i)).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(refresh).toHaveBeenCalled();
  });

  it('navigates home when subscribed', async () => {
    ctx.mockReturnValue({
      status: { is_subscribed: true, has_free_tier: false, can_access_premium: true, free_tier_expires_at: '' },
      error: null,
      refresh: vi.fn(),
      invalidate: vi.fn(),
    });
    render(<MemoryRouter><BillingSuccess /></MemoryRouter>);
    expect(screen.getByText(/you're subscribed/i)).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(1600); });
    expect(navigate).toHaveBeenCalledWith('/dashboard/app');
  });

  it('shows error state when context reports an error', () => {
    ctx.mockReturnValue({
      status: null,
      error: new Error('Internal Server Error'),
      refresh: vi.fn(),
      invalidate: vi.fn(),
    });
    render(<MemoryRouter><BillingSuccess /></MemoryRouter>);
    expect(screen.getByText(/couldn't verify your subscription/i)).toBeInTheDocument();
    expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

});
