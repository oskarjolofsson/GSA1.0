
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import SignInPopup from '@/shared/components/popup/signInPopup';
import { useNavigate } from 'react-router-dom';

export default function RequireAuth() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // Still checking session
  if (loading) {
    return <div>Loading...</div>
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/?auth=signin" replace />;   // Redirect to landing page with sign-in popup
  }

  // Logged in
  return <Outlet />
}
