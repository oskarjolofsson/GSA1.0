import { deriveGateState } from 'features/shared/connectivity/useBackendHealth';

// Pure gate decision. Device offline always wins over the backend probe; the
// spinner ('checking') only surfaces while online and still on the first probe.
describe('deriveGateState', () => {
  it('blocks on offline regardless of backend status', () => {
    expect(deriveGateState(true, 'checking')).toBe('blocked-offline');
    expect(deriveGateState(true, 'healthy')).toBe('blocked-offline');
    expect(deriveGateState(true, 'unreachable')).toBe('blocked-offline');
  });

  it('blocks on an unreachable backend when online', () => {
    expect(deriveGateState(false, 'unreachable')).toBe('blocked-backend');
  });

  it('shows the spinner only while the first probe is in flight', () => {
    expect(deriveGateState(false, 'checking')).toBe('checking');
  });

  it('opens the app when online and the backend is healthy', () => {
    expect(deriveGateState(false, 'healthy')).toBe('open');
  });
});
