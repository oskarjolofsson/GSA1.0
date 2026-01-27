import { auth } from "../lib/firebase";
const API = import.meta.env.VITE_API_URL || '';

class UserService {

    async fetchAuthenticated(url, options) {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');
        const idToken = await user.getIdToken();

        const headers = {
            ...options?.headers,
            'Authorization': `Bearer ${idToken}`
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fetch error: ${response.status} ${response.statusText} - ${errorText}`);
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

export default new UserService();