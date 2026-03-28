
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  // Not logged in
  if (!user) {

    // Store the intended path for post-login redirect
    const intendedPath = location.pathname + location.search;
    if (intendedPath !== "/") {
      sessionStorage.setItem("postLoginRedirect", intendedPath);
    }

    return <Navigate to="/?auth=signin" replace />;   // Redirect to landing page with sign-in popup
  }

  // Logged in
  return <Outlet />
}
