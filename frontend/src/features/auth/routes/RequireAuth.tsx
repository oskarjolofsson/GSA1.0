
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RequireAuth() {
  const { user, loading } = useAuth()

  // Still checking session
  if (loading) {
    return <div>Loading...</div>
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Logged in
  return <Outlet />
}
