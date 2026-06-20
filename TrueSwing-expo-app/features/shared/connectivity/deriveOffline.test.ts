import { deriveOffline } from 'features/shared/connectivity/ConnectivityContext';

// Pure offline-predicate logic. The conservative rules matter: a false positive
// flashes the banner on a healthy connection; a false negative hides a real outage.
describe('deriveOffline', () => {
  it('is offline when internet is explicitly unreachable (captive portal)', () => {
    expect(deriveOffline(true, false)).toBe(true);
  });

  it('is online when internet is reachable', () => {
    expect(deriveOffline(true, true)).toBe(false);
  });

  it('treats the initial unknown state as online (no launch flash)', () => {
    expect(deriveOffline(null, null)).toBe(false);
  });

  it('falls back to isConnected when reachability is unknown', () => {
    expect(deriveOffline(false, null)).toBe(true);
    expect(deriveOffline(true, null)).toBe(false);
  });
});
