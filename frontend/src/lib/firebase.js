// Firebase
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalyticsConsent } from "./consent.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY_TS,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN_TS,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID_TS,
  storageBucket: import.meta.env.VITE_FIREBASE_STORRAGE_BUCKET_TS, 
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID_TS,
  appId: import.meta.env.VITE_FIREBASE_APP_ID_TS,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID_TS,
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
// Use the correct OAuth prompt value: "select_account"
googleProvider.setCustomParameters({ prompt: "select_account" });

// Collect analytics only if user has given consent
export const analytics = await getAnalyticsConsent().then((consent) => {
    if (consent) {
        return typeof window !== "undefined" && firebaseConfig.measurementId
            ? getAnalytics(app)
            : undefined;
    } else {
        return undefined;
    }
});