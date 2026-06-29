import { getErrorMessage, getAuthErrorMessage, ApiError } from 'lib/errors';

const CONNECTION_MSG = 'Unable to connect to the server. Please check your internet connection.';

// Mimics a supabase-js AuthApiError: an Error carrying a `code` string.
function authError(code: string, message = 'raw supabase message') {
  return Object.assign(new Error(message), { code });
}

describe('getErrorMessage — network detection', () => {
  it('maps React Native fetch failure to the connection message', () => {
    // RN rejects a failed fetch with TypeError: Network request failed.
    expect(getErrorMessage(new TypeError('Network request failed'))).toBe(CONNECTION_MSG);
  });

  it('still maps the browser strings to the connection message', () => {
    expect(getErrorMessage(new Error('Failed to fetch'))).toBe(CONNECTION_MSG);
    expect(getErrorMessage(new Error('NetworkError when fetching'))).toBe(CONNECTION_MSG);
  });

  it('does not treat a server error as a connection problem', () => {
    expect(getErrorMessage(new ApiError(500, 'boom'))).not.toBe(CONNECTION_MSG);
  });

  it('maps "Not signed in" to the sign-in message', () => {
    expect(getErrorMessage(new Error('Not signed in'))).toBe('Please sign in to continue.');
  });
});

describe('getAuthErrorMessage — Supabase auth codes', () => {
  it('maps invalid_credentials to a friendly message', () => {
    expect(getAuthErrorMessage(authError('invalid_credentials'))).toBe(
      'Incorrect email or password.'
    );
  });

  it('maps email_not_confirmed to the verify-email message', () => {
    expect(getAuthErrorMessage(authError('email_not_confirmed'))).toBe(
      'Please verify your email before signing in. Check your inbox for the confirmation link.'
    );
  });

  it('maps both user_already_exists and email_exists to the same message', () => {
    const msg = 'An account with this email already exists. Try signing in instead.';
    expect(getAuthErrorMessage(authError('user_already_exists'))).toBe(msg);
    expect(getAuthErrorMessage(authError('email_exists'))).toBe(msg);
  });

  it('maps rate-limit codes to the wait message', () => {
    const msg = 'Too many attempts. Please wait a moment and try again.';
    expect(getAuthErrorMessage(authError('over_request_rate_limit'))).toBe(msg);
    expect(getAuthErrorMessage(authError('over_email_send_rate_limit'))).toBe(msg);
  });

  it('falls through to the network message for an offline error', () => {
    expect(getAuthErrorMessage(new TypeError('Network request failed'))).toBe(CONNECTION_MSG);
  });

  it('falls through to getErrorMessage for an unknown code', () => {
    expect(getAuthErrorMessage(authError('some_new_code', 'raw message'))).toBe('raw message');
  });

  it('falls through for an error with no code at all', () => {
    expect(getAuthErrorMessage(new Error('plain error'))).toBe('plain error');
  });
});
