import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '@/layouts/admin/components/hooks/useAdmin';
import NotFound from '@/app/public/notFound';
import { LoadingState } from '@/shared/components/cards/loading';
import PublicLayout from '@/layouts/public/PublicLayout';

export default function RequireAdmin() {
  const { isAdmin, loading } = useAdmin();
  console.log('Admin status:', { isAdmin, loading });

  if (loading) {
    return(
      <PublicLayout>
        <LoadingState title="" />
      </PublicLayout>
      );
  }

  if (!isAdmin) {
    return (
    <PublicLayout>
    <NotFound />
      </PublicLayout>
  );
  }

  return <Outlet />;
}
