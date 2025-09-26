import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

/**
 * Token Service for managing user tokens in Firestore
 */
class TokenService {
  async _fetch(path, body) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    const idToken = await user.getIdToken();
    const res = await fetch(`/api/tokens/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    return res.json();
  }

  async initializeUserTokens() {
    return this._fetch('initialize');
  }

  async getTokenCountRealTime(userId, callback) {
    // Keep reads client-side if rules allow reading own doc
    const userDocRef = doc(db, 'users', userId);
    return onSnapshot(userDocRef, snap => callback(snap.data()?.tokens ?? 0));
  }

  async canSpendTokens(amount = 1) {
    // Ask backend to check current balance (or read snapshot and check locally if you prefer)
    const { canSpend } = await this._fetch('can-spend', { amount });
    return canSpend;
  }

  async spendTokens(amount = 1, idempotencyKey) {
    const { tokens } = await this._fetch('spend', { amount, idempotencyKey });
    return tokens;
  }

  async addTokens(amount, reason = 'reward') {
    const { tokens } = await this._fetch('add', { amount, reason });
    return tokens;
  }
}

export default new TokenService();
