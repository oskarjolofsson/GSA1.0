import { Outlet } from "react-router-dom";
import BottomNav from "../../components/nav/BottomNav.jsx";
import SessionHeader from "../../components/nav/sessionHeader.jsx";
import TopographyBackground from '../../components/background/topography.jsx';
import DashboardSidebar from "../../components/sidebar/dashboardSidebar.jsx";

export default function DashboardLayout() {
  return (
    <div className="fixed inset-0 bg-[#0b1020] text-slate-100 overflow-hidden flex flex-col min-h-screen">

      <TopographyBackground />

      {/* Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        <div>
          <DashboardSidebar />
        </div>
        <div className="w-full flex flex-col overflow-hidden">
          <SessionHeader />
          <main className="relative z-10 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}