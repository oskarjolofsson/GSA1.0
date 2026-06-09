import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { BillingProvider, useBilling } from './BillingContext';

const getBillingStatus = vi.fn();
vi.mock('./services/billing', () => ({
  getBillingStatus: () => getBillingStatus(),
  startCheckout: vi.fn(),
  openCustomerPortal: vi.fn(),
}));

const handlerRef: { current: ((url: string) => void) | null } = { current: null };
vi.mock('@/lib/apiClient', () => ({
  registerPaymentRequiredHandler: (h: (url: string) => void) => {
    handlerRef.current = h;
    return () => { handlerRef.current = null; };
  },
}));

function Probe() {
  const { status, openPaywall } = useBilling();
  return (
    <div>
      <span data-testid="sub">{String(status?.is_subscribed ?? 'null')}</span>
      <button onClick={() => openPaywall('manual')}>open</button>
    </div>
  );
}

const wrap = () =>
  render(
    <MemoryRouter>
      <BillingProvider>
        <Probe />
      </BillingProvider>
    </MemoryRouter>,
  );

describe('BillingContext', () => {
  beforeEach(() => {
    getBillingStatus.mockReset();
    handlerRef.current = null;
  });

  it('fetches status on mount', async () => {
    getBillingStatus.mockResolvedValue({
      is_subscribed: true,
      has_free_tier: false,
      can_access_premium: true,
      free_tier_expires_at: '2030-01-01T00:00:00Z',
    });
    wrap();
    await waitFor(() => expect(screen.getByTestId('sub')).toHaveTextContent('true'));
    expect(getBillingStatus).toHaveBeenCalledTimes(1);
  });

  it('registers a 402 handler that re-fetches and opens paywall', async () => {
    getBillingStatus.mockResolvedValueOnce({
      is_subscribed: true,
      has_free_tier: false,
      can_access_premium: true,
      free_tier_expires_at: '2030-01-01T00:00:00Z',
    });
    wrap();
    await waitFor(() => expect(screen.getByTestId('sub')).toHaveTextContent('true'));

    getBillingStatus.mockResolvedValueOnce({
      is_subscribed: false,
      has_free_tier: false,
      can_access_premium: false,
      free_tier_expires_at: '2020-01-01T00:00:00Z',
    });
    expect(handlerRef.current).not.toBeNull();
    await act(async () => {
      handlerRef.current!('/api/v1/practice/start');
    });
    await waitFor(() => expect(screen.getByTestId('sub')).toHaveTextContent('false'));
    expect(getBillingStatus).toHaveBeenCalledTimes(2);
  });

  it('tolerates "Not signed in" without setting error', async () => {
    getBillingStatus.mockRejectedValueOnce(new Error('Not signed in'));
    wrap();
    await waitFor(() => expect(getBillingStatus).toHaveBeenCalled());
    expect(screen.getByTestId('sub')).toHaveTextContent('null');
  });

  it('ignores 402s from /billing/ URLs to avoid loops', async () => {
    getBillingStatus.mockResolvedValue({
      is_subscribed: false,
      has_free_tier: true,
      can_access_premium: true,
      free_tier_expires_at: '2030-01-01T00:00:00Z',
    });
    wrap();
    await waitFor(() => expect(getBillingStatus).toHaveBeenCalledTimes(1));
    await act(async () => {
      handlerRef.current!('/api/v1/billing/status');
    });
    expect(getBillingStatus).toHaveBeenCalledTimes(1);
  });
});
