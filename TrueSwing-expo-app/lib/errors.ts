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

const ERROR_MESSAGES: Record<number, string> = {
    400: 'The request was invalid. Please check your input and try again.',
    401: 'Please sign in to continue.',
    403: "You don't have permission to access this resource.",
    404: 'The requested resource was not found.',
    422: 'The provided data is invalid. Please check your input.',
    500: 'Something went wrong on our end. Please try again later.',
};

/** Anything unmapped falls through to the error's own message. */
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return ERROR_MESSAGES[error.status] || error.message;
    }
    
    if (error instanceof Error) {
        // React Native's fetch rejects with `TypeError: Network request failed`, not the
        // browser's "Failed to fetch" / "NetworkError". Match all three.
        if (
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError') ||
            error.message.includes('Network request failed')
        ) {
            return 'Unable to connect to the server. Please check your internet connection.';
        }
        if (error.message === 'Not signed in') {
            return 'Please sign in to continue.';
        }
        return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
}

/**
 * Friendly text for Supabase auth error codes. Keyed on AuthApiError's stable `code`, not
 * on the raw English message, which changes between versions.
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

/** Anything unmapped -- network failures, generic errors -- falls through to
 *  getErrorMessage. */
export function getAuthErrorMessage(error: unknown): string {
    const code = (error as { code?: string })?.code;
    if (code && AUTH_ERROR_MESSAGES[code]) {
        return AUTH_ERROR_MESSAGES[code];
    }
    return getErrorMessage(error);
}

export function getErrorStatus(error: unknown): number | null {
    if (error instanceof ApiError) {
        return error.status;
    }
    return null;
}

export function isAuthError(error: unknown): boolean {
    if (error instanceof ApiError) {
        return error.status === 401;
    }
    if (error instanceof Error) {
        return error.message === 'Not signed in';
    }
    return false;
}

export function isForbiddenError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 403;
}

export function isNotFoundError(error: unknown): boolean {
    return error instanceof ApiError && error.status === 404;
}
