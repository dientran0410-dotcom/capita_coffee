import { Navigate, Outlet } from 'react-router-dom';
import { extractRoleFromToken, getStoredToken, normalizeRole } from '../../utils/authHelpers';

export interface RouteProps {
  role: string[];
}

const ProtectedRoute = ({ role }: RouteProps) => {
  const rawUser =
    localStorage.getItem('user') ||
    sessionStorage.getItem('user') ||
    localStorage.getItem('auth_user') ||
    sessionStorage.getItem('auth_user');

  let user: any = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  const token = getStoredToken();

  // Check if user is authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const tokenRole = extractRoleFromToken(token);

  const resolvedRole = normalizeRole(
    user?.roleName ||
      user?.role ||
      tokenRole ||
      localStorage.getItem('role') ||
      sessionStorage.getItem('role'),
  ).toLowerCase();

  // Check if user has required role
  const allowed = role.map((item) => normalizeRole(item).toLowerCase());
  if (!allowed.includes(resolvedRole)) {
    return <Navigate to="/403" replace />;
  }

  if (resolvedRole === 'supplier') {
    const accountStatus = String(
      user?.accountStatus || user?.raw?.accountStatus || user?.raw?.status || '',
    ).toUpperCase();

    const supplierStatus = String(
      user?.supplierStatus || user?.status || user?.raw?.status || '',
    ).toUpperCase();

    if (accountStatus !== 'ACTIVE' || supplierStatus !== 'APPROVED') {
      return <Navigate to="/403" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
