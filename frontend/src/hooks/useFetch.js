import { auth } from "../firebase";

async function useFetchAuthenticated(url, options) {
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

export { useFetchAuthenticated };