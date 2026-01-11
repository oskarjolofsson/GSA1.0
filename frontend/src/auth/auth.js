import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider} from "../lib/firebase.js";
import { getAnalyticsConsent, setAnalyticsConsent } from "../lib/consent.js";

const URL = import.meta.env.VITE_API_URL;

export async function login() {
    const result = await signInWithPopup(auth, googleProvider);

    // Add user info to your database if needed
    const user = result.user;
    await registerUserInBackend(user);

    // Set consent to what is registered in backend or local storage
    await setAnalyticsConsent(await getAnalyticsConsent());

    return result;
}


export async function logout() {
    await signOut(auth);
}

async function registerUserInBackend(user) {
    const token = await user.getIdToken();

    await fetch(`${URL}/api/v1/users/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            uid: user.uid,
        }),
    });
}