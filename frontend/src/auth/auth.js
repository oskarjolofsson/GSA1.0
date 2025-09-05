import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider} from "../lib/firebase.js";

export async function login() {
    const result = await signInWithPopup(auth, googleProvider);

    // TODO cookies thorugh backend

    return result;
}


export async function logout() {
    // TODO remove cookie from flask backend
    await signOut(auth);
}