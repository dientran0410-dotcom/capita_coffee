import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  role?: string[];
}

const ProtectedRoute = ({ role }: ProtectedRouteProps) => {
  // TODO: Replace with actual authentication logic
  const isAuthenticated = true; // Mock authentication
  const userRole = 'admin'; // Mock user role - get from auth context/store

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (role && !role.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
