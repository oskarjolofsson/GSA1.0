import { Outlet, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/authContext.jsx';

import Nav from './components/TopNav.jsx';
import Footer from './components/footer.jsx';
import { ConsentBanner } from '../../shared/components/popup/consentBanner.jsx';
import TopographyBackground from '../../shared/layout/topography.jsx';

export default function Layout() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const forceLanding = searchParams.get("view") === "landing";
  const isRootLanding = location.pathname === "/";

  if (user && isRootLanding && !forceLanding) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col relative z-0 overflow-hidden bg-[#0b1020] text-slate-100">
      <TopographyBackground />
      <Nav />

      <main className="flex-1">
        <Outlet />
      </main>
      <ConsentBanner />
      <Footer />
    </div>
  );
}
