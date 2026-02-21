import { supabase } from '@/lib/supabase';

const API = import.meta.env.VITE_API_URL || '';

class UserService {

    async fetchAuthenticated(url, options) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;
        if (!session) throw new Error('Not signed in');
        const idToken = session.access_token;

        const headers = {
            ...options?.headers,
            'Authorization': `Bearer ${idToken}`
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            try {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Fetch error: ${response.status} ${response.statusText}`);
            } catch (jsonError) {
                // Fallback if response is not JSON
                throw new Error(`Fetch error: ${response.status} ${response.statusText}`);
            }
        }

        return response;
    }

    async setConsent(consent) {
        // Make sure consent is a boolean
        consent = Boolean(consent);
        
        const url = `${API}/api/v1/users/consent`;
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consent })
        };
        await this.fetchAuthenticated(url, options);
    }

    async getConsent() {
        const url = `${API}/api/v1/users/consent`;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };
        const response = await this.fetchAuthenticated(url, options);
        const data = await response.json();
        return data.consent === true;
    }
}

const userService = new UserService();

async function getAnalyticsConsent() {
    const cached = localStorage.getItem("analytics_consent");
    if (cached !== null) {
        return cached === "true";
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = data.session;
    if (!session) {
        return false; // Not signed in, so no consent
    }

    if (session) {
        try {
            const consent = await userService.getConsent();    
            localStorage.setItem("analytics_consent", consent.toString());
            return consent === "true";
        } catch (error) {
            console.error("Failed to fetch consent from server:", error);
            // Fallback: return false (deny tracking) on error as safe default
            return false;
        }
    }
    
    // No cached value and user not logged in - return false as safe default
    return false;
}

async function setAnalyticsConsent(consent) {
    consent = Boolean(consent);
    localStorage.setItem("analytics_consent", consent.toString());
    
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const session = data.session;
    
    if (session) {
        try {
            await userService.setConsent(consent);
        } catch (error) {
            console.error("Failed to save consent to server:", error);
            // Still saved locally, but warn user about sync failure
        }
    }
}

function hasUserGivenConsent() {
    const consent = localStorage.getItem("analytics_consent");
    return consent === "true" || consent === "false";
}



export { getAnalyticsConsent, setAnalyticsConsent, hasUserGivenConsent };