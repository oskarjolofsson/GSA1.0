import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PaywallModal from './PaywallModal';

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const startCheckout = vi.fn();
vi.mock('../services/billing', () => ({
  startCheckout: (...args: unknown[]) => startCheckout(...args),
}));

const wrap = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('PaywallModal', () => {
  beforeEach(() => {
    navigate.mockReset();
    startCheckout.mockReset();
  });

  it('calls startCheckout when Subscribe clicked', async () => {
    startCheckout.mockResolvedValueOnce(undefined);
    wrap(<PaywallModal open reason="gate" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));
    await waitFor(() => expect(startCheckout).toHaveBeenCalled());
  });

  it('navigates to /dashboard/app on Maybe later', () => {
    const onClose = vi.fn();
    wrap(<PaywallModal open reason="manual" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /maybe later/i }));
    expect(onClose).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/dashboard/app');
  });

  it('shows error if checkout fails', async () => {
    startCheckout.mockRejectedValueOnce(new Error('boom'));
    wrap(<PaywallModal open reason="402" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /subscribe/i }));
    await waitFor(() =>
      expect(screen.getByText(/could not start checkout/i)).toBeInTheDocument(),
    );
  });
});
