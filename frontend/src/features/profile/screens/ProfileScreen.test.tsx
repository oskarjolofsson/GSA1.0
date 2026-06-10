import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfileScreen from './ProfileScreen';

const mockAuth = vi.fn();
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockAuth(),
}));

// SubscriptionCard pulls billing context; stub it so this test focuses on
// ProfileScreen's own rendering (the null-user regression).
vi.mock('@/features/billing/components/SubscriptionCard', () => ({
  default: () => <div data-testid="subscription-card" />,
}));

describe('ProfileScreen', () => {
  it('renders without crashing when user is null during loading (regression)', () => {
    // Previously crashed: `user.name` was read unguarded while user can be null.
    mockAuth.mockReturnValue({ user: null, loading: true });
    render(<ProfileScreen />);
    expect(screen.getByText(/General Information/i)).toBeInTheDocument();
    expect(screen.getByTestId('subscription-card')).toBeInTheDocument();
  });

  it('renders the user name and email when loaded', () => {
    mockAuth.mockReturnValue({ user: { name: 'Ada', email: 'ada@example.com' }, loading: false });
    render(<ProfileScreen />);
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('ada@example.com')).toBeInTheDocument();
  });
});
