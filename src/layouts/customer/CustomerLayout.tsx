import SideBar from "../../components/layout/Sidebar";
import { Outlet } from "react-router-dom";

const CustomerLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <div className="flex flex-1">
        <SideBar userRole="customer" />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
