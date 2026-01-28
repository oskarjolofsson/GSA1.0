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

// Import components
import PublicLayout from './public/layout.jsx';
import RequireAuth from '../auth/requireAuth.jsx';
import DashboardLayout from './dashboard/layout.jsx';

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
    path: "*",
    element: <NotFound />,
  },
]);
