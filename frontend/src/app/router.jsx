import { createBrowserRouter } from "react-router-dom";

// Import pages
import Home from "./public/landing.jsx";
import NotFound from './public/notFound.jsx';
import Products from './public/Products.jsx';
import Profile from "./dashboard/profile.jsx";
import ResultsPage from "./public/results.jsx";
import TermsAndCond from './public/termsAndCond.jsx';
import Privacy from './public/privacy.jsx';
import Success from './public/success.jsx';
import Cancel from './public/cancel.jsx';
import DashboardUpload from './dashboard/upload.jsx';
import Drills from './dashboard/drills.jsx';
import Analysis from './dashboard/analysis.jsx';
import Issues from './dashboard/issue.jsx';

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
      { index: true, element: <Home /> },
      { path: "pricing", element: <Products /> },
      { path: "legal/terms-and-conditions", element: <TermsAndCond /> },
      { path: "legal/privacy-policy", element: <Privacy /> },
      { path: "results/:analysisId", element: <ResultsPage /> },
    ],
  },
  {
    path: "/dashboard",
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardUpload /> },
          { path: "upload", element: <DashboardUpload /> },
          { path: "billing/cancel", element: <Cancel /> },
          { path: "analyse", element: <Analysis /> },
          { path: "profile", element: <Profile /> },
          { path: "drills", element: <Drills /> },
          { path: "issues", element: <Issues /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
