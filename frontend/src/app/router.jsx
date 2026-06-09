import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

// Import pages
import Landing from "./public/landing.jsx";
import NotFound from './public/notFound.jsx';
import Profile from "./dashboard/profile.jsx";
import TermsAndCond from './public/termsAndCond.jsx';
import Privacy from './public/privacy.jsx';
import DashboardUpload from './dashboard/upload.jsx';
import Drills from './dashboard/drills/drills';
import Analysis from './dashboard/analysis.jsx';
import Issues from './dashboard/issue/page.jsx';
import HomeDashboard from "./dashboard/home.jsx";
import AdminHome from "./admin/home.jsx";
import AdminDrills from "./admin/drills.jsx";
import AdminIssues from "./admin/issues.jsx";
import AdminMappings from "./admin/mappings.jsx";
import AdminUsers from "./admin/users.jsx";
import Feedback from "./admin/feedback.jsx";
import DrillResults from "./dashboard/drills/results.jsx";
import AuthCallback from "./public/auth/callback/page";

// Import components
import PublicLayout from './public/layout.jsx';
import RequireAuth from '@/features/auth/routes/RequireAuth';
import RequireAdmin from '@/features/admin/routes/RequireAdmin';
import DashboardLayout from './dashboard/layout.jsx';
import AdminLayout from './admin/layout.jsx';

// Billing
import { BillingProvider } from '@/features/billing/BillingContext';
import PremiumGate from '@/features/billing/components/PremiumGate';
import PricingPage from '@/features/billing/screens/PricingPage';
import BillingSuccess from '@/features/billing/screens/BillingSuccess';
import SettingsScreen from '@/features/billing/screens/SettingsScreen';

const BillingShell = () => (
  <BillingProvider>
    <Outlet />
  </BillingProvider>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Landing /> },
      { path: "legal/terms-and-conditions", element: <TermsAndCond /> },
      { path: "legal/privacy-policy", element: <Privacy /> },
      { path: "auth/callback", element: <AuthCallback /> },
      {
        element: <BillingShell />,
        children: [{ path: "pricing", element: <PricingPage /> }],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "/billing/success",
    element: <RequireAuth />,
    errorElement: <NotFound />,
    children: [
      {
        element: <BillingShell />,
        children: [{ index: true, element: <BillingSuccess /> }],
      },
    ],
  },
  {
    path: "/dashboard",
    element: <RequireAuth />,
    errorElement: <NotFound />,
    children: [
      {
        element: <BillingShell />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <Navigate to="/dashboard/app" replace /> },
              { path: "app", element: <HomeDashboard /> },
              { path: "upload", element: <PremiumGate><DashboardUpload /></PremiumGate> },
              { path: "analysis", element: <Analysis /> },
              { path: "profile", element: <Profile /> },
              { path: "drills", element: <PremiumGate><Drills /></PremiumGate> },
              { path: "drills/results", element: <PremiumGate><DrillResults /></PremiumGate> },
              { path: "issues", element: <Issues /> },
              { path: "settings", element: <SettingsScreen /> },
              { path: "*", element: <NotFound /> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <RequireAdmin />,
    path: "/admin",
    errorElement: <NotFound />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/home" replace /> },
          { path: "home", element: <AdminHome /> },
          { path: "drills", element: <AdminDrills /> },
          { path: "issues", element: <AdminIssues /> },
          { path: "mappings", element: <AdminMappings /> },
          { path: "users", element: <AdminUsers /> },
          { path: "feedback", element: <Feedback /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
