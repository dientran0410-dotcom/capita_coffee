import { Outlet } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const SupplierRoute = () => {
  return (
    <MainLayout userRole="supplier">
      <Outlet />
    </MainLayout>
  );
};

export default SupplierRoute;
