import { useAuth } from "../auth/authContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="p-6">
      <h1>Dashboard</h1>
      <p>Welcome, {user?.displayName || user?.email}</p>
      <button onClick={logout}>Sign out</button>

      {/* Show the amount of tokens of the user */}
    </div>
  );
}
