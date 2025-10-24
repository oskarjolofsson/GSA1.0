import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const API = import.meta.env.VITE_API_URL || '';

/**
 * Token Service for managing user tokens in Firestore
 */
class TokenService {
  async _fetch(path, body) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not signed in');
    const idToken = await user.getIdToken();
    const url = `${API}/api/v1/tokens/${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: body ? JSON.stringify(body) : undefined
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

  async getBalance() {
    const user = auth.currentUser;
    if (!user) return null; // not signed in yet
    const idToken = await user.getIdToken();
    const url = `${API}/api/v1/tokens/balance`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    let json = null;
    try { json = await res.json(); } catch (e) { json = null; }
    if (!res.ok) {
      const err = json?.error || json?.message || res.statusText || 'Request failed';
      console.error('getBalance failed:', err);
      return null;
    }
    return json?.tokens ?? json?.token_count ?? null;
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
    const json = await this._fetch('can-spend', { amount });
    return json?.canSpend ?? false;
  }

  async spendTokens(amount = 1, idempotencyKey) {
    const body = { amount };
    if (idempotencyKey) body.idempotencyKey = idempotencyKey;
    const json = await this._fetch('spend', body);
    return json?.remaining_tokens ?? json?.tokens ?? null;
  }

  async addTokens(amount, reason = 'reward') {
    const json = await this._fetch('add', { amount, reason });
    return json?.new_balance ?? null;
  }

  async verifyAndSpend(amount = 1, action = 'upload', idempotencyKey) {
    const body = { amount, action };
    if (idempotencyKey) body.idempotencyKey = idempotencyKey;
    const json = await this._fetch('verify-and-spend', body);
    return json;
  }

  getUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
  }
}

export default new TokenService();
