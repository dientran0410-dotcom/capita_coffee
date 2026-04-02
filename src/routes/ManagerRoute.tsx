import { Outlet } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const ManagerRoute = () => {
  return (
    <MainLayout userRole="manager">
      <Outlet />
    </MainLayout>
  );
};

export default ManagerRoute;
