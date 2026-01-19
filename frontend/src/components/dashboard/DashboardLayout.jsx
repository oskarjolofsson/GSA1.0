import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import TopographyBackground from '../background/topography.jsx';

export default function DashboardLayout() {
  return (
    <div className="fixed inset-0 bg-[#0b1020] text-slate-100 overflow-hidden flex flex-col">

      <TopographyBackground />

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
