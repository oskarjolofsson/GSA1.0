import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const API = import.meta.env.VITE_API_URL || '';

/**
 * Subscription Service for managing subscriptions in Stripe
 */
class SubscriptionService {

    constructor(firebase_user_id) {
        this.firebase_user_id = firebase_user_id;
    }

    async _fetch(path, body, method = 'POST') {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');
        const idToken = await user.getIdToken();
        const url = `${API}/stripe${path}`;
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 
                       'Authorization': `Bearer ${idToken}` 
                    },
            body: body && method !== 'GET' ? JSON.stringify(body) : undefined
        });
        // try parse json if available
        let json = null;
        try { json = await res.json(); } catch (e) { json = null; }
        if (!res.ok) {
            const err = json?.error || json?.message || res.statusText || 'Request failed';
            throw new Error(err);
        }
        return json;
    }

    async getActiveSubscription() {
        const res = await this._fetch('/subscription-status', null, 'GET');
        return !!res?.price_id;
    }

    async getActivePriceId() {
        const res = await this._fetch('/subscription-status', null, 'GET');
        return res?.price_id || null;
    }

    async createCheckoutSession(priceId) {
        const res = await this._fetch('/create-checkout-session', { priceId });
        return res?.url;
    }

    async switchSubscription(newPriceId) {
        return await this._fetch('/switch-subscription', { newPriceId });
    }

    async getUpcomingInvoicePrice(newPriceId) {
        const user = auth.currentUser;
        if (!user) throw new Error('Not signed in');
        const idToken = await user.getIdToken();
        const url = `${API}/stripe/upcoming-invoice_price?newPriceId=${newPriceId}`;
        const res = await fetch(url, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${idToken}` 
            },
        });
        if (!res.ok) {
            throw new Error('Failed to fetch prorated charge');
        }
        const data = await res.json();
        return data.new_charge;
    }
}

export default new SubscriptionService();
