import { Outlet } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const AdminRoute = () => {
  return (
    <MainLayout userRole="admin">
      <Outlet />
    </MainLayout>
  );
};

export default AdminRoute;
