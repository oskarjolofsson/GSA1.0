import { fetchWithAuth, registerPaymentRequiredHandler } from 'lib/apiClient';
import { ApiError } from 'lib/errors';

jest.mock('lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'tok' } },
        error: null,
      }),
    },
  },
}));

function mockResponse(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `status ${status}`,
    json: async () => body,
  } as unknown as Response;
}

describe('apiClient 402 backstop', () => {
  const handler = jest.fn();

  beforeEach(() => {
    registerPaymentRequiredHandler(handler);
    handler.mockClear();
  });

  afterEach(() => {
    registerPaymentRequiredHandler(null);
    jest.restoreAllMocks();
  });

  it('fires the handler once on a 402 from a premium URL and still throws ApiError', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse(402, { detail: 'Payment Required' }));

    await expect(fetchWithAuth('/api/v1/analysis/')).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('/api/v1/analysis/');
  });

  it('ignores 402s from /billing/ URLs (no refresh loop)', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse(402, { detail: 'Payment Required' }));

    await expect(fetchWithAuth('/api/v1/billing/status')).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire on non-402 errors', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse(500, { detail: 'boom' }));

    await expect(fetchWithAuth('/api/v1/analysis/')).rejects.toBeInstanceOf(ApiError);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire on success', async () => {
    global.fetch = jest.fn().mockResolvedValue(mockResponse(200, { ok: true }));

    await expect(fetchWithAuth('/api/v1/analysis/')).resolves.toEqual({ ok: true });
    expect(handler).not.toHaveBeenCalled();
  });
});
