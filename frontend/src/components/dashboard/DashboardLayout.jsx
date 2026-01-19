import { Outlet } from "react-router-dom";
import BottomNav from "../nav/BottomNav.jsx";
import SessionHeader from "../nav/sessionHeader.jsx";
import TopographyBackground from '../background/topography.jsx';
import DashboardSidebar from "../sidebar/dashboardSidebar.jsx";

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
          <main className="relative z-10 flex-1 overflow-y-auto border border-white/10 rounded-xl m-4 p-3">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}