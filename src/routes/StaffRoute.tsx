import { Outlet } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const StaffRoute = () => {
  return (
    <MainLayout userRole="staff">
      <Outlet />
    </MainLayout>
  );
};

export default StaffRoute;
