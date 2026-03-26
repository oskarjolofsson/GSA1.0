import { Outlet } from "react-router-dom";
import TopographyBackground from '../../shared/layout/topography';
import AdminSidebar from "./components/AdminSidebar";
import { useAdmin } from "./components/hooks/useAdmin";
import { LoadingState } from "@/shared/components/cards/loading";
import NotFoundScreen from "@/features/notFound/screens/notFoundScreen";

export default function AdminLayout() {
    const { isAdmin, loading } = useAdmin();

    if (loading) return <LoadingState title="" />

    if (!loading && !isAdmin) return <NotFoundScreen />

  return (
    <div className="fixed inset-0 bg-[#0b1020] text-slate-100 overflow-auto flex flex-col min-h-screen">
      <TopographyBackground />

      {/* Sidebar and Content */}
      <div className="flex flex-1 overflow-hidden">
        <div>
          <AdminSidebar />
        </div>
        <div className="w-full flex flex-col overflow-hidden">
          <main className="relative z-10 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
