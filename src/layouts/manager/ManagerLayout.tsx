import { useEffect } from "react";
import SideBar from "../../components/layout/Sidebar";
import { Outlet } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { appToastContainerProps, installAlertAsToast } from "../../utils/toast";
import "react-toastify/dist/ReactToastify.css";
import "../../pages/customer/toastStyles.css";

const ManagerLayout = () => {
  useEffect(() => installAlertAsToast(), []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <div className="flex flex-1">
        <SideBar userRole="manager" />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer {...appToastContainerProps} />
    </div>
  );
};

export default ManagerLayout;
