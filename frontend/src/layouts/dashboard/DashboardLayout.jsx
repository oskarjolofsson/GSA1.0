import { Outlet } from "react-router-dom";
import SessionHeader from "../../shared/components/sessionHeader.jsx";
import TopographyBackground from '../../shared/layout/topography.jsx';
import DashboardSidebar from "./components/dashboardSidebar.jsx";

export default function DashboardLayout() {
  return (
    <div className="fixed inset-0 bg-[#0b1020] text-slate-100 overflow-auto flex flex-col min-h-screen">

      <TopographyBackground />

      {/* Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        <div>
          <DashboardSidebar />
        </div>
        <div className="w-full flex flex-col overflow-hidden">
          {/* <SessionHeader /> */}
          <main className="relative z-10 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}