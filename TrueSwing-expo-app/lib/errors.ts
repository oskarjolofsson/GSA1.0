/**
 * Custom error class for API errors that preserves HTTP status codes
 */
export class ApiError extends Error {
    public readonly status: number;
    public readonly code: string;
    public readonly detail?: string;

    constructor(status: number, message: string, detail?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = getErrorCode(status);
        this.detail = detail;
    }
}

/**
 * Map HTTP status codes to error codes
 */
function getErrorCode(status: number): string {
    switch (status) {
        case 400:
            return 'BAD_REQUEST';
        case 401:
            return 'UNAUTHORIZED';
        case 403:
            return 'FORBIDDEN';
        case 404:
            return 'NOT_FOUND';
        case 422:
            return 'VALIDATION_ERROR';
        case 500:
            return 'SERVER_ERROR';
        default:
            return 'UNKNOWN_ERROR';
    }
}

/**
 * User-friendly error messages based on HTTP status codes
 */
const ERROR_MESSAGES: Record<number, string> = {
    400: 'The request was invalid. Please check your input and try again.',
    401: 'Please sign in to continue.',
    403: "You don't have permission to access this resource.",
    404: 'The requested resource was not found.',
    422: 'The provided data is invalid. Please check your input.',
    500: 'Something went wrong on our end. Please try again later.',
};

/**
 * Get a user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return ERROR_MESSAGES[error.status] || error.message;
    }
    
    if (error instanceof Error) {
        // Check for network errors. React Native's fetch rejects with
        // `TypeError: Network request failed` (not the browser's "Failed to fetch"
        // / "NetworkError"), so match all three to detect offline on every platform.
        if (
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('Network request failed')
        ) {
            return 'Unable to connect to the server. Please check your internet connection.';
        }
        // Check for "Not signed in" error from session check
        if (error.message === 'Not signed in') {
            return 'Please sign in to continue.';
        }
        return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
}

/**
 * Friendly text for Supabase auth error codes. Supabase-js exposes a stable
 * `code` string on AuthApiError (e.g. 'invalid_credentials'); we key off that
 * rather than the raw English message, which can change between versions.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
    invalid_credentials: 'Incorrect email or password.',
    email_not_confirmed:
        'Please verify your email before signing in. Check your inbox for the confirmation link.',
    user_already_exists: 'An account with this email already exists. Try signing in instead.',
    email_exists: 'An account with this email already exists. Try signing in instead.',
    weak_password: 'Please choose a stronger password.',
    over_request_rate_limit: 'Too many attempts. Please wait a moment and try again.',
    over_email_send_rate_limit: 'Too many attempts. Please wait a moment and try again.',
    signup_disabled: 'Sign-ups are currently disabled.',
    email_address_invalid: 'Enter a valid email address.',
};

/**
 * Get a user-friendly message for an auth error. Maps the Supabase auth `code`
 * to clear text; anything unmapped (network failures, generic errors) falls
 * through to getErrorMessage.
 */
export function getAuthErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code;
    if (code && AUTH_ERROR_MESSAGES[code]) {
        return AUTH_ERROR_MESSAGES[code];
    }
    return getErrorMessage(error);
}

/**
 * Get the HTTP status code from an error (if available)
 */
export function getErrorStatus(error: unknown): number | null {
    if (error instanceof ApiError) {
        return error.status;
    }
    return null;
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
    if (error instanceof ApiError) {
        return error.status === 401;
    }
    if (error instanceof Error) {
        return error.message === 'Not signed in';
    }
    return false;
}

/**
 * Check if an error is a permission error
 */
export function isForbiddenError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 403;
}

/**
 * Check if an error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 404;
}
