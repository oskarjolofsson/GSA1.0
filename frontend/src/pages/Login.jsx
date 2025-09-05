import { useAuth } from "../auth/authContext";

export default function Login() {
    const {login, loading, user} = useAuth();

    if (loading) return null;
    if (user) return <div className="p-6">You are already signed in.</div>;

    return (
        <div className="p-6">
            <h1>Sign in</h1>
            <button onClick={login}>Sign in with Google</button>
        </div>
    );
}