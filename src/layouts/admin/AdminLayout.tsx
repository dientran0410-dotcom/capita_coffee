import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import SideBar from "../../components/layout/Sidebar";
import { appToastContainerProps, installAlertAsToast } from "../../utils/toast";
import { NotificationProvider } from "../../context/NotificationContext";
import { NotificationDisplay } from "../../components/common/NotificationDisplay";
import "react-toastify/dist/ReactToastify.css";
import "../../pages/customer/toastStyles.css";

const AdminLayout = () => {
  const location = useLocation();
  const userRole = location.pathname.startsWith("/manager")
    ? "manager"
    : location.pathname.startsWith("/staff")
      ? "staff"
      : location.pathname.startsWith("/supplier")
        ? "supplier"
        : "admin";

  const isNotificationPage = ['/loyalty', '/promotion', '/reward', '/coupon'].some(
    path => location.pathname.toLowerCase().includes(path)
  );

  useEffect(() => installAlertAsToast(), []);

  const content = (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <div className="flex flex-1">
        <SideBar userRole={userRole} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer {...appToastContainerProps} />
    </div>
  );

  return isNotificationPage ? (
    <NotificationProvider>
      {content}
      <NotificationDisplay />
    </NotificationProvider>
  ) : (
    content
  );
};

export default AdminLayout;
