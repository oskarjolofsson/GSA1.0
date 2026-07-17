import { pingBackend } from 'features/shared/connectivity/healthService';

// Reachability probe: any HTTP response means the server is up; a rejected fetch
// (network error / abort) means it's down. The timer must always be cleared.
describe('pingBackend', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is reachable on a 200 response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200 } as Response);
    await expect(pingBackend()).resolves.toBe(true);
  });

  it('is reachable on a 500 response (server answered, just errored)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 500 } as Response);
    await expect(pingBackend()).resolves.toBe(true);
  });

  it('is unreachable when fetch rejects (network error / abort)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));
    await expect(pingBackend()).resolves.toBe(false);
  });

  it('clears the timeout timer on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({ status: 200 } as Response);
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    await pingBackend();
    expect(clearSpy).toHaveBeenCalled();
  });

  it('clears the timeout timer on failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('boom'));
    const clearSpy = jest.spyOn(global, 'clearTimeout');
    await pingBackend();
    expect(clearSpy).toHaveBeenCalled();
  });
});
