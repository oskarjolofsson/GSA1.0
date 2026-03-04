import { createBrowserRouter, Navigate } from "react-router-dom";

// Import pages
import Landing from "./public/landing.jsx";
import NotFound from './public/notFound.jsx';
import Profile from "./dashboard/profile.jsx";
import TermsAndCond from './public/termsAndCond.jsx';
import Privacy from './public/privacy.jsx';
import DashboardUpload from './dashboard/upload.jsx';
import Drills from './dashboard/drills.jsx';
import Analysis from './dashboard/analysis.jsx';
import Issues from './dashboard/issue.jsx';
import HomeDashboard from "./dashboard/home.jsx";
import AdminHome from "./admin/home.jsx";
import AdminDrills from "./admin/drills.jsx";
import AdminIssues from "./admin/issues.jsx";
import AdminMappings from "./admin/mappings.jsx";
import AdminUsers from "./admin/users.jsx";
import Feedback from "./admin/feedback.jsx";

// Import components
import PublicLayout from './public/layout.jsx';
import RequireAuth from '@/features/auth/routes/RequireAuth';
import DashboardLayout from './dashboard/layout.jsx';
import AdminLayout from './admin/layout.jsx';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Landing /> },
      { path: "legal/terms-and-conditions", element: <TermsAndCond /> },
      { path: "legal/privacy-policy", element: <Privacy /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "/dashboard",
    element: <RequireAuth />,
    errorElement: <NotFound />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard/app" replace /> },
          { path : "app", element: <HomeDashboard /> },
          { path: "upload", element: <DashboardUpload /> },
          { path: "analysis", element: <Analysis /> },
          { path: "profile", element: <Profile /> },
          { path: "drills", element: <Drills /> },
          { path: "issues", element: <Issues /> },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
  {
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
