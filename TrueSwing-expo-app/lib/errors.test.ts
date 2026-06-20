import { getErrorMessage, ApiError } from 'lib/errors';

const CONNECTION_MSG = 'Unable to connect to the server. Please check your internet connection.';

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
