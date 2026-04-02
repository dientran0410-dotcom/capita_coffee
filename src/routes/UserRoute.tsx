import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * UserRoute component that allows CUSTOMER and guest users to access routes
 * Other roles (ADMIN, MANAGER, STAFF, SUPPLIER) will be redirected to their dashboards
 */
const UserRoute = () => {
  const { isAuthenticated, role } = useAuth();

  // If authenticated and not a customer, redirect to appropriate dashboard
  if (isAuthenticated && role !== 'CUSTOMER') {
    const redirectMap: Record<string, string> = {
      ADMIN: '/admin',
      MANAGER: '/manager',
      STAFF: '/staff',
      SUPPLIER: '/supplier',
    };

    const redirectPath = redirectMap[role] || '/';
    return <Navigate to={redirectPath} replace />;
  }

  // Allow guest users or customers to access
  return <Outlet />;
};

export default UserRoute;
