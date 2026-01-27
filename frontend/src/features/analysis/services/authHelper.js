import { auth } from '../../../lib/firebase';

/**
 * Wait for user to be ready for authenticated requests
 */
export async function ensureUserReady() {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) {
      resolve();
    } else {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        if (user) {
          resolve();
        } else {
          reject(new Error('Not signed in'));
        }
      });
    }
  });
}
