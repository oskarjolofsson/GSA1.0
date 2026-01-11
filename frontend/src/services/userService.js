import useFetchAuthenticated from "../hooks/useFetch";
const API = import.meta.env.VITE_API_URL || '';

class UserService {

    async setConsent(consent) {
        // Make sure consent is a boolean
        consent = Boolean(consent);
        
        const url = `${API}/api/v1/users/consent`;
        console.log("Setting consent to:", consent, "at URL:", url);
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consent })
        };
        await useFetchAuthenticated(url, options);
    }

    async getConsent() {
        const url = `${API}/api/v1/users/consent`;
        const options = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };
        const response = await useFetchAuthenticated(url, options);
        const data = await response.json();
        return data.consent === true;
    }
}

export default new UserService();