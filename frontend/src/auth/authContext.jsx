import { createContext, useActionState, useContext, useEffect, useState  } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { login as doLogin, logout as doLogout } from "./auth";


const AuthCtx = createContext({
    user: null,
    loading: true,
    login: async () => {},
    logout: async () => {},
});


export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(null);

    useEffect(() => {
        // Subscribe once to Firebase auth state
        const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
        });
        return unsub;
    }, []);

    const value = { user, loading, login: doLogin, logout: doLogout };
    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}


export function useAuth() {
    return useContext(AuthCtx);
}