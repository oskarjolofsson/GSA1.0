import { supabase } from 'lib/supabase';
import { ApiError } from 'lib/errors';

const API = process.env.EXPO_PUBLIC_API_URL;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/**
 * Global 402 Payment Required backstop. The billing layer registers a handler
 * (typically: invalidate status + open the paywall). Any premium request that
 * reaches the backend and gets a 402 pops the paywall, even on screens that
 * aren't proactively gated. 402s from /billing/ URLs are ignored to avoid loops.
 */
type PaymentRequiredHandler = (url: string) => void;

let paymentRequiredHandler: PaymentRequiredHandler | null = null;

export function registerPaymentRequiredHandler(handler: PaymentRequiredHandler | null) {
    paymentRequiredHandler = handler;
}

/**
 * Shared authenticated fetch utility for all API requests.
 * Automatically handles:
 * - Supabase session retrieval and token injection
 * - Error responses with proper ApiError creation
 * - 204 No Content responses
 * 
 * @throws {ApiError} When the server returns an error response
 * @throws {Error} When not signed in or session retrieval fails
 */
export async function fetchWithAuth<T>(
    url: string,
    method: HttpMethod = 'GET',
    body?: unknown
): Promise<T> {
    const {
        data: { session },
        error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session) throw new Error('Not signed in');

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
        },
    };

    if (body !== undefined && body !== null) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API}${url}`, options);

    if (!response.ok) {
        let detail: string | undefined;
        
        try {
            const errorData = await response.json();
            detail = typeof errorData.detail === 'string' 
                ? errorData.detail 
                : JSON.stringify(errorData.detail);
        } catch {
            // Response is not JSON, use statusText
            detail = response.statusText;
        }

        // Backstop: notify the billing layer on Payment Required, except for
        // billing's own calls (avoids a refresh → 402 → refresh loop).
        if (response.status === 402 && !url.includes('/billing/')) {
            paymentRequiredHandler?.(url);
        }

        throw new ApiError(
            response.status,
            detail || `Server error ${response.status}`,
            detail
        );
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

/**
 * Convenience methods for common HTTP operations
 */
export const apiClient = {
    get: <T>(url: string) => fetchWithAuth<T>(url, 'GET'),
    post: <T>(url: string, body?: unknown) => fetchWithAuth<T>(url, 'POST', body),
    patch: <T>(url: string, body?: unknown) => fetchWithAuth<T>(url, 'PATCH', body),
    put: <T>(url: string, body?: unknown) => fetchWithAuth<T>(url, 'PUT', body),
    delete: <T>(url: string, body?: unknown) => fetchWithAuth<T>(url, 'DELETE', body),
};

export default apiClient;
